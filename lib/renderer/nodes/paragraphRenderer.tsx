import { memo } from "react";
import { View } from "react-native";
import { useRenderNodeChildren } from "../node";
import type { ExtractFromPredicate, isParagraphNode } from "../types";

export const ParagraphRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isParagraphNode> }) => {
		return <View className="py-2">{useRenderNodeChildren(node.children)}</View>;
	},
);
