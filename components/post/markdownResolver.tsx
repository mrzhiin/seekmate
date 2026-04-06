import { memo, Suspense } from "react";
import { ErrorBoundary } from "../errorBoundary";
import { MarkdownView } from "./markdownView";

export const MarkdownResolver = memo(
	({ html, textSize }: { html: string; textSize?: string }) => {
		return (
			<ErrorBoundary>
				<Suspense>
					<MarkdownView html={html} textSize={textSize} />
				</Suspense>
			</ErrorBoundary>
		);
	},
);
