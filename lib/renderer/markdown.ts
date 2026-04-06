import type { TextMatchTransformer } from "@lexical/markdown";
import { $createImageNode, ImageNode } from "./nodes/imageNode";

// Custom IMAGE transformer for markdown: ![alt](url)
// IMPORTANT: This must come BEFORE LINK in the transformers array because
// LINK's importRegExp would match [alt](url) in ![alt](url) and consume it first
const IMAGE: TextMatchTransformer = {
	dependencies: [ImageNode],
	export: (_node, _exportChildren) => {
		return null;
	},
	importRegExp: /!\[([^\]]*)\]\(([^)]+)\)/,
	regExp: /!\[([^\]]*)\]\(([^)]+)\)/,
	replace: (textNode, match) => {
		const [, altText, src] = match;
		const imageNode = $createImageNode({ altText, src });
		textNode.replace(imageNode);
	},
	trigger: ")",
	type: "text-match",
};

export { IMAGE };
