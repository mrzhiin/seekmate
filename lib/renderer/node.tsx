import type { SerializedLexicalNode } from "lexical";
import { useMemo } from "react";
import { CodeRenderer } from "./nodes/codeRenderer";
import { HeadingRenderer } from "./nodes/headingRenderer";
import { ImageRenderer } from "./nodes/imageRenderer";
import { LineBreakRenderer } from "./nodes/lineBreakRenderer";
import { LinkRenderer } from "./nodes/linkRenderer";
import { ListItemRenderer } from "./nodes/listItemRenderer";
import { ListRenderer } from "./nodes/listRenderer";
import { ParagraphRenderer } from "./nodes/paragraphRenderer";
import { QuoteRenderer } from "./nodes/quoteRenderer";
import { RootRenderer } from "./nodes/rootRenderer";
import { TabsRenderer } from "./nodes/tabsRenderer";
import { TextRenderer } from "./nodes/textRenderer";
import { TextsRenderer } from "./nodes/textsRenderer";
import {
	type ExtractFromPredicate,
	isCodeNode,
	isHeadingNode,
	isImageNode,
	isLineBreakNode,
	isLinkNode,
	isListItemNode,
	isListNode,
	isParagraphNode,
	isQuoteNode,
	isRootNode,
	isTabsNode,
	isTextNode,
} from "./types";

export { HeadingRenderer } from "./nodes/headingRenderer";
export { TextsRenderer } from "./nodes/textsRenderer";

export type TextGroup = (
	| ExtractFromPredicate<isTextNode>
	| ExtractFromPredicate<isLinkNode>
	| ExtractFromPredicate<isLineBreakNode>
)[];

const groupConsecutiveTextNodes = (
	children: SerializedLexicalNode[],
): (SerializedLexicalNode | TextGroup)[] => {
	const result: (SerializedLexicalNode | TextGroup)[] = [];
	let textGroup: TextGroup = [];

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const isText =
			isTextNode(child) || isLinkNode(child) || isLineBreakNode(child);

		if (isText) {
			textGroup.push(child);
		} else {
			if (textGroup.length > 0) {
				result.push(textGroup);
				textGroup = [];
			}
			result.push(child);
		}
	}

	if (textGroup.length > 0) {
		result.push(textGroup);
	}

	return result;
};

export const useRenderNodeChildren = (children: SerializedLexicalNode[]) => {
	return useMemo(() => {
		if (!children) return null;

		const groups = groupConsecutiveTextNodes(children);

		return groups.map((group, index) => {
			const key = index;

			if (Array.isArray(group)) {
				if (group.length === 0) return null;

				if (group.length === 1) {
					return <NodeRenderer key={key} node={group[0]} />;
				}

				return <TextsRenderer key={key} nodes={group} />;
			}
			return <NodeRenderer key={key} node={group} />;
		});
	}, [children]);
};

export const NodeRenderer = ({ node }: { node: SerializedLexicalNode }) => {
	if (isRootNode(node)) {
		return <RootRenderer node={node} />;
	}
	if (isParagraphNode(node)) {
		return <ParagraphRenderer node={node} />;
	}
	if (isHeadingNode(node)) {
		return <HeadingRenderer node={node} />;
	}
	if (isTextNode(node)) {
		return <TextRenderer node={node} />;
	}
	if (isLinkNode(node)) {
		return <LinkRenderer node={node} />;
	}
	if (isListNode(node)) {
		return <ListRenderer node={node} />;
	}
	if (isListItemNode(node)) {
		return <ListItemRenderer node={node} />;
	}
	if (isLineBreakNode(node)) {
		return <LineBreakRenderer />;
	}
	if (isQuoteNode(node)) {
		return <QuoteRenderer node={node} />;
	}
	if (isImageNode(node)) {
		return <ImageRenderer node={node} />;
	}
	if (isCodeNode(node)) {
		return <CodeRenderer node={node} />;
	}
	if (isTabsNode(node)) {
		return <TabsRenderer node={node} />;
	}
	return null;
};
