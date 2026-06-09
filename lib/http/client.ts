import axios, { AxiosError } from "axios";
import Constants from "expo-constants";
import * as v from "valibot";
import { resetUserSessionFromAuthError } from "@/lib/auth/session";
import { config } from "../config";

export const nsClient = axios.create({
	baseURL: config.apiBaseUrl,
});

nsClient.interceptors.request.use(
	async (config) => {
		const headers = config.headers;
		const ua = await Constants.getWebViewUserAgentAsync();

		if (!headers.has("User-Agent")) {
			headers.set("User-Agent", ua);
		}

		return config;
	},
	(error) => {
		Promise.reject(error);
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
				v.safeParse(ErrorUser404Schema, data).success ||
				v.safeParse(ErrorUser401Schema, data).success
			) {
				resetUserSessionFromAuthError();
			}
		}

		return Promise.reject(error);
	},
);
