import axios, { AxiosError, CanceledError } from "axios";
import Constants from "expo-constants";
import * as v from "valibot";
import { signOutUserSession, waitForSessionCleanup } from "@/lib/auth/session";
import { Sentry } from "@/lib/sentry";
import { userStore } from "@/store/userStore";
import { config } from "../config";

const requestUsers = new WeakMap<object, number | undefined>();

export const nsClient = axios.create({
	baseURL: config.apiBaseUrl,
});

nsClient.interceptors.request.use(
	async (config) => {
		const userId = userStore.getState().id;
		await waitForSessionCleanup();
		if (userStore.getState().id !== userId)
			throw new CanceledError("User session changed");
		requestUsers.set(config, userId);
		const headers = config.headers;
		const ua = await Constants.getWebViewUserAgentAsync();

		if (!headers.has("User-Agent")) {
			headers.set("User-Agent", ua);
		}

		if (userStore.getState().id !== userId)
			throw new CanceledError("User session changed");
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

const ErrorUser404Schema = v.object({
	// message: v.literal("USER NOT FOUND"),
	status: v.literal(404),
	success: v.literal(false),
});

const ErrorUser401Schema = v.object({
	status: v.literal(401),
	success: v.literal(false),
});

nsClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error instanceof AxiosError) {
			const data = error.response?.data;
			if (
				error.config &&
				requestUsers.get(error.config) === userStore.getState().id &&
				(v.safeParse(ErrorUser404Schema, data).success ||
					v.safeParse(ErrorUser401Schema, data).success)
			) {
				void signOutUserSession().catch((error: unknown) =>
					Sentry.captureException(error),
				);
			}
		}

		return Promise.reject(error);
	},
);
