import { memo, useMemo } from "react";
import { Renderer } from "@/lib/renderer";
import { convertFromMarkdownToState } from "@/lib/renderer/utils";

export const ContentView = memo(
	({
		markdown,
		textClassName,
	}: {
		markdown: string;
		size?: "base" | "lg";
		textClassName?: string;
	}) => {
		const state = useMemo(() => {
			return convertFromMarkdownToState(markdown);
		}, [markdown]);

		return state && <Renderer state={state} textClassName={textClassName} />;
	},
);
