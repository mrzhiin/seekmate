import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
	createEditor,
	LineBreakNode,
	type SerializedEditorState,
	type SerializedLexicalNode,
	TextNode,
} from "lexical";
import { IMAGE, parseMarkdownSegments } from "@/lib/renderer/markdown";
import { ImageNode } from "@/lib/renderer/nodes/imageNode";
import type { SerializedTabsNode } from "@/lib/renderer/types";

const CUSTOM_TRANSFORMERS = [IMAGE, ...TRANSFORMERS];

const createMarkdownEditor = () => {
	return createEditor({
		nodes: [
			HeadingNode,
			LineBreakNode,
			QuoteNode,
			TextNode,
			LinkNode,
			ListNode,
			ListItemNode,
			CodeNode,
			CodeHighlightNode,
			ImageNode,
		],
	});
};

const convertStandardMarkdownToState = (
	markdown: string,
): SerializedEditorState => {
	const editor = createMarkdownEditor();

	editor.update(
		() => {
			$convertFromMarkdownString(markdown, CUSTOM_TRANSFORMERS);
		},
		{ discrete: true },
	);

	return editor.getEditorState().toJSON();
};

export const convertFromMarkdownToState = (markdown: string) => {
	const segments = parseMarkdownSegments(markdown);
	const state = convertStandardMarkdownToState("");
	const children: SerializedLexicalNode[] = [];

	for (const segment of segments) {
		if (segment.type === "markdown") {
			if (!segment.content) continue;

			children.push(
				...convertStandardMarkdownToState(segment.content).root.children,
			);
			continue;
		}

		const tabsNode: SerializedTabsNode = {
			type: "tabs",
			version: 1,
			tabs: segment.tabs.map((tab) => ({
				title: tab.title,
				children: convertStandardMarkdownToState(tab.content).root.children,
			})),
		};

		children.push(tabsNode);
	}

	state.root.children = children;

	return state;
};
