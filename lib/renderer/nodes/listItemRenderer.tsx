import { TextNode } from "lexical";
import { memo, useContext } from "react";
import { Text as RNText, View } from "react-native";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { NodeContext } from "../context";
import { useRenderNodeChildren } from "../node";
import type { ExtractFromPredicate, isListItemNode } from "../types";

export const ListItemRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isListItemNode> }) => {
		const nodeContext = useContext(NodeContext);

		return (
			<View className="flex-row gap-2 pl-4">
				{node.children[0]?.type === TextNode.getType() ? (
					<RNText className={`${nodeContext.textClassName}`} selectable>
						{nodeContext.listType === "bullet" ? (
							<MaterialDesignIcons name="circle-medium" size={14} />
						) : (
							`${node.value}.`
						)}
					</RNText>
				) : null}
				<View className="flex-1">{useRenderNodeChildren(node.children)}</View>
			</View>
		);
	},
);
