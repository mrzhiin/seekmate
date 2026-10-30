import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { type TestContext } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

type Session = typeof import("@/lib/auth/sessionCommand");
const source = ts.transpileModule(
	readFileSync(
		new URL("../lib/auth/sessionCommand.ts", import.meta.url),
		"utf8",
	),
	{
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	},
).outputText;

function setup(t: TestContext) {
	const state = {
		id: 42 as number | undefined,
		name: "old user" as string | undefined,
		reset: () => {
			state.id = undefined;
			state.name = undefined;
		},
		update: (value: { id: number; name?: string }) =>
			Object.assign(state, value),
	};
	const clearCookies = t.mock.fn(async () => true);
	const flushCookies = t.mock.fn(async () => {});
	const removeCache = t.mock.fn(async () => {});
	const clearQueries = t.mock.fn(() => {});
	const resetData = t.mock.fn(() => {});
	const dependencies: Record<string, unknown> = {
		"react-native-nitro-cookies": {
			__esModule: true,
			default: { clearAll: clearCookies, flush: flushCookies },
		},
		"@/lib/query": {
			asyncStoragePersister: { removeClient: removeCache },
			queryClient: { clear: clearQueries },
		},
		"@/store/userDataStore": {
			userDataStore: { getState: () => ({ reset: resetData }) },
		},
		"@/store/userStore": { userStore: { getState: () => state } },
	};
	const exports = {} as Session;
	runInNewContext(source, {
		exports,
		Error,
		require: (name: string) => {
			assert.ok(name in dependencies, `Unexpected import: ${name}`);
			return dependencies[name];
		},
	});
	return {
		...exports,
		state,
		clearCookies,
		flushCookies,
		removeCache,
		clearQueries,
		resetData,
	};
}

test("sign-out resets local data immediately and deduplicates pending cleanup", async (t) => {
	const h = setup(t);
	const cookies = Promise.withResolvers<boolean>();
	h.clearCookies.mock.mockImplementation(() => cookies.promise);
	const first = h.signOutUserSession();
	assert.equal(h.state.id, undefined);
	assert.equal(h.resetData.mock.callCount(), 1);
	assert.equal(h.clearQueries.mock.callCount(), 1);
	assert.equal(h.signOutUserSession(), first);
	cookies.resolve(true);
	await first;
	await h.waitForSessionCleanup();
	assert.equal(h.flushCookies.mock.callCount(), 1);
});

for (const failure of ["cookies", "cache"] as const) {
	test(`${failure} cleanup failure still waits for the other cleanup before allowing retry`, async (t) => {
		const h = setup(t);
		const error = new Error("cleanup failed");
		const cookies = Promise.withResolvers<boolean>();
		const cache = Promise.withResolvers<void>();
		h.clearCookies.mock.mockImplementation(() => cookies.promise);
		h.removeCache.mock.mockImplementation(() => cache.promise);
		const cleanup = h.signOutUserSession();
		const rejected = assert.rejects(cleanup, (actual) => actual === error);
		let settled = false;
		void cleanup.then(
			() => {
				settled = true;
			},
			() => {
				settled = true;
			},
		);
		if (failure === "cookies") cookies.reject(error);
		else cache.reject(error);
		await new Promise<void>((resolve) => setImmediate(resolve));
		try {
			assert.equal(settled, false);
			assert.equal(h.signOutUserSession(), cleanup);
		} finally {
			cookies.resolve(true);
			cache.resolve();
			await rejected;
		}
		await assert.rejects(
			h.waitForSessionCleanup(),
			(actual) => actual === error,
		);
		await assert.rejects(h.signInUserSession(99), (actual) => actual === error);
		h.clearCookies.mock.mockImplementation(async () => true);
		h.removeCache.mock.mockImplementation(async () => {});
		await h.signOutUserSession();
		await h.signInUserSession(99);
		assert.equal(h.state.id, 99);
	});
}

test("a false cookie cleanup result blocks subsequent sign-in", async (t) => {
	const h = setup(t);
	h.clearCookies.mock.mockImplementation(async () => false);
	await assert.rejects(h.signOutUserSession(), /Cookie cleanup failed/);
	await assert.rejects(h.signInUserSession(99), /Cookie cleanup failed/);
	assert.equal(h.state.id, undefined);
});

test("signing in again as the same user clears stale queries and private settings", async (t) => {
	const h = setup(t);
	await h.signInUserSession(42);
	assert.equal(h.clearQueries.mock.callCount(), 1);
	assert.equal(h.resetData.mock.callCount(), 1);
	assert.equal(h.state.name, undefined);
});

test("cancelled or invalid sign-in does not modify the current session", async (t) => {
	const h = setup(t);
	await h.signInUserSession(99, AbortSignal.abort());
	for (const id of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
		await assert.rejects(h.signInUserSession(id), /Invalid user id/);
	}
	assert.equal(h.state.id, 42);
	assert.equal(h.clearQueries.mock.callCount(), 0);
	assert.equal(h.resetData.mock.callCount(), 0);
});
