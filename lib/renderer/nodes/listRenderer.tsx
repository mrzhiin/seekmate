import { memo, useContext, useMemo } from "react";
import { View } from "react-native";
import { NodeContext } from "../context";
import { useRenderNodeChildren } from "../node";
import type { ExtractFromPredicate, isListNode } from "../types";

export const ListRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isListNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(
			() => ({
				...nodeContext,
				listType: node.listType,
			}),
			[nodeContext, node.listType],
		);

		return (
			<NodeContext.Provider value={value}>
				<View className="gap-2">{useRenderNodeChildren(node.children)}</View>
			</NodeContext.Provider>
		);
	},
);
