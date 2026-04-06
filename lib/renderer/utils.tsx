import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { createEditor, LineBreakNode, TextNode } from "lexical";
import { IMAGE } from "@/lib/renderer/markdown";
import { ImageNode } from "@/lib/renderer/nodes/imageNode";

const CUSTOM_TRANSFORMERS = [IMAGE, ...TRANSFORMERS];

export const convertFromMarkdownToState = (markdown: string) => {
	const editor = createEditor({
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

	editor.update(
		() => {
			$convertFromMarkdownString(markdown, CUSTOM_TRANSFORMERS);
		},
		{ discrete: true },
	);

	return editor.getEditorState().toJSON();
};
