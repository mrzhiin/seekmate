import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { type TestContext } from "node:test";
import { runInNewContext } from "node:vm";
import type { FetchRequestInit } from "expo/fetch";
import ts from "typescript";
import * as v from "valibot";
import { ErrorUser401Schema } from "@/lib/auth/validation";

type Client = typeof import("@/lib/http/client").nsClient;
const source = ts.transpileModule(
	readFileSync(new URL("../lib/http/client.ts", import.meta.url), "utf8"),
	{
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	},
).outputText;

// Execute the real client with native modules stubbed; no device or live credentials needed.
function setup(t: TestContext) {
	const state = { id: 42 as number | undefined };
	const timeout = new AbortController();
	const timeoutSignal = t.mock.fn((_milliseconds: number) => timeout.signal);
	const fetch = t.mock.fn(
		async (_url: string | URL, _init?: FetchRequestInit): Promise<Response> =>
			Response.json({ success: true }),
	);
	const cleanup = t.mock.fn(async () => {});
	const signOut = t.mock.fn(async () => {});
	const userAgent = t.mock.fn(async (): Promise<string | null> => "WebView UA");
	const capture = t.mock.fn((_error: unknown) => {});
	const dependencies: Record<string, unknown> = {
		"expo/fetch": { fetch },
		"expo-constants": {
			__esModule: true,
			default: { getWebViewUserAgentAsync: userAgent },
		},
		valibot: v,
		"@/lib/auth/session": {
			waitForSessionCleanup: cleanup,
			signOutUserSession: signOut,
		},
		"@/lib/auth/validation": { ErrorUser401Schema },
		"@/lib/config": { config: { apiBaseUrl: "https://api.example.com/base" } },
		"@/lib/sentry": { Sentry: { captureException: capture } },
		"@/store/userStore": { userStore: { getState: () => state } },
	};
	const exports: { nsClient?: Client } = {};
	runInNewContext(source, {
		exports,
		require: (name: string) => {
			assert.ok(name in dependencies, `Unexpected import: ${name}`);
			return dependencies[name];
		},
		Headers,
		URL,
		DOMException,
		Error,
		AbortSignal: { any: AbortSignal.any, timeout: timeoutSignal },
	});
	assert.ok(exports.nsClient);
	return {
		client: exports.nsClient,
		state,
		timeout,
		timeoutSignal,
		fetch,
		cleanup,
		signOut,
		userAgent,
		capture,
	};
}

test("returns a fetch Response with the API base, UA, cookies and a 30s timeout", async (t) => {
	const h = setup(t);
	const response = await h.client("api/account/getInfo/42");
	assert.deepEqual(await response.json(), { success: true });
	const [url, init] = h.fetch.mock.calls[0].arguments;
	assert.equal(
		String(url),
		"https://api.example.com/base/api/account/getInfo/42",
	);
	assert.equal(new Headers(init?.headers).get("User-Agent"), "WebView UA");
	assert.equal(init?.credentials, "include");
	assert.equal(h.timeoutSignal.mock.calls[0].arguments[0], 30_000);
	assert.equal(h.cleanup.mock.callCount(), 1);
});

test("reads HTML and preserves encoded search params, site base and custom headers", async (t) => {
	const h = setup(t);
	h.fetch.mock.mockImplementation(async () => new Response("<h1>Post</h1>"));
	const params = new URLSearchParams({ page: "2", q: "中文 & + #" });
	const response = await h.client(`search?${params}`, {
		baseURL: "https://www.example.com/",
		headers: { "User-Agent": "Custom UA", Accept: "text/html" },
	});
	assert.equal(await response.text(), "<h1>Post</h1>");
	const [input, init] = h.fetch.mock.calls[0].arguments;
	const url = new URL(String(input));
	assert.equal(url.origin, "https://www.example.com");
	assert.equal(url.pathname, "/search");
	assert.equal(url.searchParams.get("q"), "中文 & + #");
	assert.equal(url.searchParams.get("page"), "2");
	assert.equal(new Headers(init?.headers).get("User-Agent"), "Custom UA");
	assert.equal(h.userAgent.mock.callCount(), 0);
});

test("does not serialize a missing WebView UA as null", async (t) => {
	const h = setup(t);
	h.userAgent.mock.mockImplementation(async () => null);
	await h.client("api/test");
	assert.equal(
		new Headers(h.fetch.mock.calls[0].arguments[1]?.headers).has("User-Agent"),
		false,
	);
});

for (const status of [401, 403, 404, 500]) {
	test(`HTTP ${status} rejects; only an explicit session failure signs out`, async (t) => {
		const h = setup(t);
		h.fetch.mock.mockImplementation(async () =>
			Response.json({ status, success: false }, { status }),
		);
		await assert.rejects(h.client("api/test"), new RegExp(`HTTP ${status}`));
		assert.equal(h.signOut.mock.callCount(), status === 401 ? 1 : 0);
	});
}

test("HTML errors and malformed 401 payloads do not sign out", async (t) => {
	const h = setup(t);
	for (const body of [
		"<h1>Unauthorized</h1>",
		"{}",
		'{"status":401,"success":true}',
	]) {
		h.fetch.mock.mockImplementation(
			async () => new Response(body, { status: 401 }),
		);
		await assert.rejects(h.client("api/test"), /HTTP 401/);
	}
	assert.equal(h.signOut.mock.callCount(), 0);
});

test("a stale 401 cannot sign out a different user", async (t) => {
	const h = setup(t);
	h.fetch.mock.mockImplementation(async () => {
		h.state.id = 99;
		return Response.json({ status: 401, success: false }, { status: 401 });
	});
	await assert.rejects(h.client("api/test"), /HTTP 401/);
	assert.equal(h.signOut.mock.callCount(), 0);
});

for (const phase of ["cleanup", "userAgent"] as const) {
	test(`session changes during ${phase} prevent sending a request`, async (t) => {
		const h = setup(t);
		if (phase === "cleanup") {
			h.cleanup.mock.mockImplementation(async () => {
				h.state.id = 99;
			});
		} else {
			h.userAgent.mock.mockImplementation(async () => {
				h.state.id = 99;
				return "UA";
			});
		}
		await assert.rejects(h.client("api/test"), { name: "AbortError" });
		assert.equal(h.fetch.mock.callCount(), 0);
	});
}

test("cleanup failures prevent requests and network failures propagate without signing out", async (t) => {
	const h = setup(t);
	const error = new Error("offline");
	h.cleanup.mock.mockImplementation(async () => {
		throw error;
	});
	await assert.rejects(h.client("api/test"), (actual) => actual === error);
	assert.equal(h.fetch.mock.callCount(), 0);
	h.cleanup.mock.mockImplementation(async () => {});
	h.fetch.mock.mockImplementation(async () => {
		throw error;
	});
	await assert.rejects(h.client("api/test"), (actual) => actual === error);
	assert.equal(h.signOut.mock.callCount(), 0);
});

test("already-cancelled requests never reach fetch", async (t) => {
	const h = setup(t);
	await assert.rejects(h.client("api/test", { signal: AbortSignal.abort() }), {
		name: "AbortError",
	});
	assert.equal(h.fetch.mock.callCount(), 0);
});

for (const reason of ["caller", "timeout"] as const) {
	test(`${reason} cancellation reaches an in-flight request`, async (t) => {
		const h = setup(t);
		const caller = new AbortController();
		const error = new DOMException(
			"cancelled",
			reason === "timeout" ? "TimeoutError" : "AbortError",
		);
		h.fetch.mock.mockImplementation(
			async (_url, init) =>
				new Promise((_resolve, reject) => {
					assert.ok(init?.signal);
					init.signal.addEventListener(
						"abort",
						() => reject(init.signal?.reason),
						{ once: true },
					);
					(reason === "timeout" ? h.timeout : caller).abort(error);
				}),
		);
		await assert.rejects(
			h.client("api/test", { signal: caller.signal }),
			(actual) => actual === error,
		);
		assert.equal(h.signOut.mock.callCount(), 0);
	});
}

test("timeout still aborts body consumption after headers have arrived", async (t) => {
	const h = setup(t);
	h.fetch.mock.mockImplementation(
		async (_url, init) =>
			new Response(
				new ReadableStream({
					start(controller) {
						init?.signal?.addEventListener(
							"abort",
							() => controller.error(init.signal?.reason),
							{ once: true },
						);
					},
				}),
			),
	);
	const response = await h.client("post-1-1");
	const body = response.text();
	h.timeout.abort(new DOMException("timed out", "TimeoutError"));
	await assert.rejects(body, { name: "TimeoutError" });
});

test("successful responses from an old session are rejected", async (t) => {
	const h = setup(t);
	h.fetch.mock.mockImplementation(async () => {
		h.state.id = 99;
		return Response.json({ name: "old user" });
	});
	await assert.rejects(h.client("api/test"), { name: "AbortError" });
	assert.equal(h.signOut.mock.callCount(), 0);
});

test("cancellation is checked even when fetch completes successfully", async (t) => {
	const h = setup(t);
	const caller = new AbortController();
	h.fetch.mock.mockImplementation(async () => {
		caller.abort();
		return Response.json({ success: true });
	});
	await assert.rejects(h.client("api/test", { signal: caller.signal }), {
		name: "AbortError",
	});
});

test("sign-out failures are reported without swallowing the HTTP error", async (t) => {
	const h = setup(t);
	const error = new Error("Cookie cleanup failed");
	h.signOut.mock.mockImplementation(async () => {
		throw error;
	});
	h.fetch.mock.mockImplementation(async () =>
		Response.json({ status: 401, success: false }, { status: 401 }),
	);
	await assert.rejects(h.client("api/test"), /HTTP 401/);
	assert.equal(h.capture.mock.calls[0].arguments[0], error);
});
