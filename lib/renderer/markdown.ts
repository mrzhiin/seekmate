import type { TextMatchTransformer } from "@lexical/markdown";
import { $createImageNode, ImageNode } from "./nodes/imageNode";

interface MarkdownTabItem {
	title: string;
	content: string;
}

type MarkdownSegment =
	| {
			type: "markdown";
			content: string;
	  }
	| {
			type: "tabs";
			tabs: MarkdownTabItem[];
	  };

interface MarkdownParserContext {
	lines: string[];
	startIndex: number;
}

interface MarkdownParserResult {
	segment: MarkdownSegment | null;
	nextIndex: number;
}

interface MarkdownBlockParser {
	name: string;
	match: (line: string) => boolean;
	parse: (context: MarkdownParserContext) => MarkdownParserResult;
}

const normalizeMarkdownLineEndings = (markdown: string) => {
	return markdown.replace(/\r\n?/g, "\n");
};

const flushParagraph = (lines: string[], output: MarkdownSegment[]) => {
	if (lines.length === 0) return;

	const content = lines.join("\n").trim();
	lines.length = 0;

	if (!content) return;

	output.push({
		type: "markdown",
		content,
	});
};

const parseTabsBlock = ({ lines, startIndex }: MarkdownParserContext) => {
	let currentTabTitle = "";
	let currentTabContent: string[] = [];
	const tabs: MarkdownTabItem[] = [];
	let nextIndex = startIndex + 1;

	const flushCurrentTab = () => {
		if (!currentTabTitle) return;

		tabs.push({
			title: currentTabTitle,
			content: currentTabContent.join("\n").trim(),
		});
		currentTabTitle = "";
		currentTabContent = [];
	};

	for (; nextIndex < lines.length; nextIndex++) {
		const line = lines[nextIndex];
		const tabItemMatch = line.match(/^:::\s+tab-item\s+(.+?)\s*$/);

		if (tabItemMatch) {
			flushCurrentTab();
			currentTabTitle = tabItemMatch[1].trim();
			currentTabContent = [];
			continue;
		}

		if (/^:::\s*$/.test(line)) {
			flushCurrentTab();
			continue;
		}

		if (/^::::\s*$/.test(line)) {
			flushCurrentTab();
			break;
		}

		currentTabContent.push(line);
	}

	return {
		segment: tabs.length > 0 ? { type: "tabs", tabs } : null,
		nextIndex,
	} satisfies MarkdownParserResult;
};

const CUSTOM_MARKDOWN_BLOCK_PARSERS: MarkdownBlockParser[] = [
	{
		name: "tabs",
		match: (line) => /^::::\s+tabs\s*$/.test(line),
		parse: parseTabsBlock,
	},
];

export const parseMarkdownSegments = (
	markdown: string,
	parsers = CUSTOM_MARKDOWN_BLOCK_PARSERS,
) => {
	const source = normalizeMarkdownLineEndings(markdown);
	const lines = source.split("\n");
	const output: MarkdownSegment[] = [];
	const paragraph: string[] = [];

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const parser = parsers.find((blockParser) => blockParser.match(line));

		if (!parser) {
			paragraph.push(line);
			continue;
		}

		flushParagraph(paragraph, output);

		const { segment, nextIndex } = parser.parse({
			lines,
			startIndex: index,
		});

		if (segment) {
			output.push(segment);
		}

		index = nextIndex;
	}

	flushParagraph(paragraph, output);

	return output;
};

// Custom IMAGE transformer for markdown: ![alt](url)
// IMPORTANT: This must come BEFORE LINK in the transformers array because
// LINK's importRegExp would match [alt](url) in ![alt](url) and consume it first
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
		const imageNode = $createImageNode({ altText, src });
		textNode.replace(imageNode);
	},
	trigger: ")",
	type: "text-match",
};
