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

	// Only trim empty lines: indentation and trailing spaces carry Markdown meaning.
	const content = lines.join("\n").replace(/^\n+|\n+$/g, "");
	lines.length = 0;

	if (!content.trim()) return;

	output.push({
		type: "markdown",
		content,
	});
};

const updateFence = (line: string, fence: string | undefined) => {
	const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
	if (!match) return fence;
	if (fence) {
		return match[1][0] === fence[0] &&
			match[1].length >= fence.length &&
			!match[2].trim()
			? undefined
			: fence;
	}
	return match[1][0] === "`" && match[2].includes("`") ? undefined : match[1];
};

const parseTabsBlock = ({ lines, startIndex }: MarkdownParserContext) => {
	let currentTabTitle = "";
	let currentTabContent: string[] = [];
	const tabs: MarkdownTabItem[] = [];
	let nextIndex = startIndex + 1;
	let fence: string | undefined;
	let closed = false;
	let malformed = false;

	const flushCurrentTab = () => {
		if (!currentTabTitle) return;

		tabs.push({
			title: currentTabTitle,
			content: currentTabContent.join("\n").replace(/^\n+|\n+$/g, ""),
		});
		currentTabTitle = "";
		currentTabContent = [];
	};

	for (; nextIndex < lines.length; nextIndex++) {
		const line = lines[nextIndex];
		const nextFence = updateFence(line, fence);
		if (fence || nextFence) {
			if (!currentTabTitle) malformed = true;
			currentTabContent.push(line);
			fence = nextFence;
			continue;
		}
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
			closed = true;
			break;
		}

		if (!currentTabTitle && line.trim()) malformed = true;
		currentTabContent.push(line);
	}

	return {
		segment:
			closed && tabs.length > 0 && !malformed
				? { type: "tabs", tabs }
				: {
						type: "markdown",
						content: lines.slice(startIndex, nextIndex + 1).join("\n"),
					},
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
	let fence: string | undefined;

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const nextFence = updateFence(line, fence);
		if (fence || nextFence) {
			paragraph.push(line);
			fence = nextFence;
			continue;
		}
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
