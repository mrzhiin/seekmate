import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { config } from "../config";

if (config.sentryDsn) {
	Sentry.init({
		dsn: config.sentryDsn,
		debug: Constants.debugMode,
		environment: Constants.debugMode ? "development" : "production",
		sendDefaultPii: false,
		tracesSampleRate: Constants.debugMode ? 1 : 0.1,
		enableLogs: false,
		profilesSampleRate: 0,
		beforeSend: (event) => {
			delete event.request;
			delete event.user;
			return event;
		},
		beforeBreadcrumb: (breadcrumb) => {
			// Network URLs and console messages may contain signed URLs or API keys.
			return breadcrumb.type === "http" || breadcrumb.category === "console"
				? null
				: breadcrumb;
		},
	});
}

export { Sentry };
