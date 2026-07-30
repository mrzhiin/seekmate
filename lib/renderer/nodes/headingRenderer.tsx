import { memo, useContext, useMemo } from "react";
import { Text as RNText } from "react-native";
import { NodeContext } from "../context";
import { useRenderNodeChildren } from "../node";
import type { ExtractFromPredicate, isHeadingNode } from "../types";

export const HeadingRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isHeadingNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(() => {
			let c = "";

			switch (node.tag) {
				case "h1":
					c = "text-3xl";
					break;
				case "h2":
					c = "text-2xl";
					break;
				case "h3":
					c = "text-xl";
					break;
				case "h4":
					c = "text-lg";
					break;
				default:
					break;
			}

			return {
				...nodeContext,
				textClassName: `${nodeContext.textClassName} ${c}`.trim(),
			};
		}, [nodeContext, node.tag]);

		return (
			<NodeContext.Provider value={value}>
				<RNText className="my-2 pl-2 border-l-2 border-primary" selectable>
					{useRenderNodeChildren(node.children)}
				</RNText>
			</NodeContext.Provider>
		);
	},
);
