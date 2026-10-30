import { type FetchRequestInit, fetch } from "expo/fetch";
import Constants from "expo-constants";
import * as v from "valibot";
import { signOutUserSession, waitForSessionCleanup } from "@/lib/auth/session";
import { ErrorUser401Schema } from "@/lib/auth/validation";
import { config } from "@/lib/config";
import { Sentry } from "@/lib/sentry";
import { userStore } from "@/store/userStore";

export const nsClient = async (
	path: string,
	{
		baseURL = config.apiBaseUrl,
		...options
	}: FetchRequestInit & {
		baseURL?: string;
	} = {},
) => {
	const userId = userStore.getState().id;

	await waitForSessionCleanup();

	if (userStore.getState().id !== userId) {
		throw new DOMException("User session changed", "AbortError");
	}

	const headers = new Headers(options.headers);

	if (!headers.has("User-Agent")) {
		const userAgent = await Constants.getWebViewUserAgentAsync();
		if (userAgent) headers.set("User-Agent", userAgent);
	}

	if (userStore.getState().id !== userId) {
		throw new DOMException("User session changed", "AbortError");
	}

	// Keep the timeout active while callers read the response body, not just its headers.
	const timeout = AbortSignal.timeout(30_000);
	const signal = options.signal
		? AbortSignal.any([options.signal, timeout])
		: timeout;

	signal.throwIfAborted();

	const response = await fetch(
		new URL(path, `${baseURL.replace(/\/+$/, "")}/`),
		{ ...options, headers, signal, credentials: "include" },
	);

	if (!response.ok) {
		const data: unknown = await response.json().catch(() => undefined);
		signal.throwIfAborted();
		if (
			userStore.getState().id === userId &&
			v.safeParse(ErrorUser401Schema, data).success
		) {
			void signOutUserSession().catch((error: unknown) =>
				Sentry.captureException(error),
			);
		}
		throw new Error(`HTTP ${response.status} ${response.statusText}`);
	}

	signal.throwIfAborted();

	if (userStore.getState().id !== userId) {
		throw new DOMException("User session changed", "AbortError");
	}

	return response;
};
