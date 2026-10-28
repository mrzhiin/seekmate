import type { SerializedEditorState } from "lexical";
import { twMerge } from "tailwind-merge";
import { NodeContext } from "./context";
import { NodeRenderer } from "./node";

export const Renderer = ({
	state,
	textClassName,
}: {
	state: SerializedEditorState;
	textClassName?: string;
}) => {
	return (
		<NodeContext.Provider
			value={{
				textClassName: twMerge("text-foreground font-medium", textClassName),
			}}
		>
			<NodeRenderer node={state.root} />
		</NodeContext.Provider>
	);
};
