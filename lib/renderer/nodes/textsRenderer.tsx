import { memo } from "react";
import { Text as RNText } from "react-native";
import { NodeRenderer, type TextGroup } from "../node";

export const TextsRenderer = memo(({ nodes }: { nodes: TextGroup }) => {
	return (
		<RNText selectable>
			{nodes.map((node, index) => {
				const key = `${index}`;
				return <NodeRenderer key={key} node={node} />;
			})}
		</RNText>
	);
});
