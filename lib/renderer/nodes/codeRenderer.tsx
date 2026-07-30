import { memo, useContext, useMemo } from "react";
import { Text as RNText } from "react-native";
import { NodeContext } from "../context";
import { useRenderNodeChildren } from "../node";
import type { ExtractFromPredicate, isQuoteNode } from "../types";

export const CodeRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isQuoteNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(
			() => ({
				...nodeContext,
				textClassName: `${nodeContext.textClassName} text-slate-300`,
			}),
			[nodeContext],
		);

		return (
			<NodeContext.Provider value={value}>
				<RNText className="my-2 p-2 rounded-xl bg-slate-600" selectable>
					{useRenderNodeChildren(node.children)}
				</RNText>
			</NodeContext.Provider>
		);
	},
);
