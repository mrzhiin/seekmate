import "tsx/cjs";
import type { ConfigContext, ExpoConfig } from "expo/config";
import * as v from "valibot";
import { ExpoExtraSchema } from "./types/expoExtra";

const AndroidVersionCode = 3;

const config = ({ config }: ConfigContext): ExpoConfig => {
	const extra = v.parse(ExpoExtraSchema, {
		apiBaseUrl: process.env.APP_PUBLIC_API_BASEURL,
		siteUrl: process.env.APP_PUBLIC_SITE_URL,
		githubUrl: process.env.APP_PUBLIC_GITHUB_URL,
		sentryDsn: process.env.APP_PUBLIC_SENTRY_DSN,
	});

	const plugins: ExpoConfig["plugins"] = [
		["expo-dev-client"],
		[
			"expo-build-properties",
			{
				android: {},
			},
		],
		["expo-image"],
		[
			"expo-splash-screen",
			{
				backgroundColor: "#ffffff",
				image: "./assets/app/splash-icon-light.png",
				dark: {
					image: "./assets/app/splash-icon-light.png",
					backgroundColor: "#333333",
				},
			},
		],
		[
			"expo-localization",
			{
				supportedLocales: {
					android: ["en", "zh-Hans"],
				},
			},
		],
	];

	if (
		process.env.APP_RELEASE_STORE_FILE &&
		process.env.APP_RELEASE_STORE_PASSWORD &&
		process.env.APP_RELEASE_KEY_ALIAS &&
		process.env.APP_RELEASE_KEY_PASSWORD
	) {
		plugins.push([
			"./plugins/withSignedPlugin.ts",
			{
				storeFile: process.env.APP_RELEASE_STORE_FILE,
				storePassword: process.env.APP_RELEASE_STORE_PASSWORD,
				keyAlias: process.env.APP_RELEASE_KEY_ALIAS,
				keyPassword: process.env.APP_RELEASE_KEY_PASSWORD,
			},
		]);
	}

	if (
		process.env.SENTRY_AUTH_TOKEN &&
		process.env.SENTRY_PROJECT &&
		process.env.SENTRY_ORGANIZATION
	) {
		plugins.push([
			"@sentry/react-native/expo",
			{
				url: "https://sentry.io/",
				project: process.env.SENTRY_PROJECT,
				organization: process.env.SENTRY_ORGANIZATION,
			},
		]);
	}

	return {
		...config,
		name: "SeekMate",
		slug: "seekmate",
		platforms: ["android"],
		userInterfaceStyle: "automatic",
		icon: "./assets/app/adaptive-icon.png",
		android: {
			package: "com.angiin.seekmate",
			versionCode: AndroidVersionCode,
		},
		plugins,
		extra,
		updates: {
			enabled: false,
		},
	};
};

export default config;
