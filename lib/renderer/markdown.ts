import type { TextMatchTransformer } from "@lexical/markdown";
import { $createImageNode, ImageNode } from "./nodes/imageNode";

export { parseMarkdownSegments } from "./markdownSegments";

// This must precede LINK, which also matches the inner [alt](url).
export const IMAGE: TextMatchTransformer = {
	dependencies: [ImageNode],
	export: (node) => {
		if (!(node instanceof ImageNode)) return null;
		return `![${node.getAltText()}](${node.getSrc()})`;
	},
	importRegExp: /!\[([^\]]*)\]\(([^)]+)\)/,
	regExp: /!\[([^\]]*)\]\(([^)]+)\)/,
	replace: (textNode, match) => {
		const [, altText, src] = match;
		textNode.replace($createImageNode({ altText, src }));
	},
	trigger: ")",
	type: "text-match",
};
