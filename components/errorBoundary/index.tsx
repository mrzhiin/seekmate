import * as Sentry from "@sentry/react-native";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { ErrorFallback } from "../errorFallback";

export const ErrorBoundary = ({ children }: PropsWithChildren) => {
	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<Sentry.ErrorBoundary
					showDialog
					onReset={reset}
					fallback={({ resetError }) => <ErrorFallback onReset={resetError} />}
				>
					{children}
				</Sentry.ErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
};
