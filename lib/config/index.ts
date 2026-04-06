import Constants from "expo-constants";
import type { ExpoExtra } from "@/types/expoExtra";

const extra = Constants.expoConfig?.extra as ExpoExtra;

export const config = {
	apiBaseUrl: extra?.apiBaseUrl,
	siteUrl: extra?.siteUrl,
	githubUrl: extra?.githubUrl,
	sentryDsn: extra?.sentryDsn,
} as const;
