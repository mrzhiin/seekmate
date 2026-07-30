import { memo, useContext, useMemo } from "react";
import { View } from "react-native";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { NodeContext } from "../context";
import { useRenderNodeChildren } from "../node";
import type { ExtractFromPredicate, isQuoteNode } from "../types";

export const QuoteRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isQuoteNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(
			() => ({
				...nodeContext,
				textClassName: `${nodeContext.textClassName} text-muted-foreground`,
			}),
			[nodeContext],
		);

		return (
			<NodeContext.Provider value={value}>
				<View className="my-2 p-2 rounded-xl bg-muted gap-0.5">
					<View>
						<MaterialDesignIcons
							name="format-quote-open"
							size={16}
							className="text-muted-foreground"
						/>
					</View>
					{useRenderNodeChildren(node.children)}
					<View className="items-end">
						<MaterialDesignIcons
							name="format-quote-close"
							size={16}
							className="text-muted-foreground"
						/>
					</View>
				</View>
			</NodeContext.Provider>
		);
	},
);
