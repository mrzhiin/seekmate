import * as Linking from "expo-linking";
import { memo, useCallback, useContext, useMemo } from "react";
import { Text as RNText } from "react-native";
import * as v from "valibot";
import { config } from "../../config";
import { NodeContext } from "../context";
import { useRenderNodeChildren } from "../node";
import type { ExtractFromPredicate, isLinkNode } from "../types";

export const LinkRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isLinkNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(
			() => ({
				...nodeContext,
				textClassName: `${nodeContext.textClassName} text-primary`,
			}),
			[nodeContext],
		);

		const onPress = useCallback(() => {
			const r = v.safeParse(
				v.pipe(v.string(), v.nonEmpty(), v.url()),
				node.url,
			);

			let url: string;

			if (r.success) {
				url = node.url;
			} else {
				url = new URL(node.url, config.apiBaseUrl).toString();
			}

			Linking.openURL(url);
		}, [node.url]);

		return (
			<NodeContext.Provider value={value}>
				<RNText onPress={onPress} selectable>
					{useRenderNodeChildren(node.children)}
				</RNText>
			</NodeContext.Provider>
		);
	},
);
