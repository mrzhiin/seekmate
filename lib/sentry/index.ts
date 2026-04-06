import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { config } from "../config";

if (config.sentryDsn && !Constants.debugMode) {
	Sentry.init({
		dsn: config.sentryDsn,
		// Adds more context data to events (IP address, cookies, user, etc.)
		// For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
		sendDefaultPii: true,
		// Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
		// We recommend adjusting this value in production.
		// Learn more at
		// https://docs.sentry.io/platforms/react-native/configuration/options/#traces-sample-rate
		tracesSampleRate: 1.0,
		// Enable logs to be sent to Sentry
		// Learn more at https://docs.sentry.io/platforms/react-native/logs/
		enableLogs: true,
		// profilesSampleRate is relative to tracesSampleRate.
		// Here, we'll capture profiles for 100% of transactions.
		profilesSampleRate: 1.0,
	});
}

export { Sentry };
