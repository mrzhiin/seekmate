import { memo, Suspense } from "react";
import { Text } from "@/components/ui/text";
import { ErrorBoundary } from "../errorBoundary";
import { ContentView } from "./contentView";

export const ContentResolver = memo(
	({
		markdown,
		textClassName,
	}: {
		markdown: string;
		textClassName?: string;
	}) => {
		return (
			<ErrorBoundary>
				<Suspense fallback={<Text>Loading...</Text>}>
					<ContentView markdown={markdown} textClassName={textClassName} />
				</Suspense>
			</ErrorBoundary>
		);
	},
);
