import type { SerializedEditorState } from "lexical";
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
				textClassName: `text-foreground text-sans font-medium ${textClassName || ""}`,
			}}
		>
			<NodeRenderer node={state.root} />
		</NodeContext.Provider>
	);
};
