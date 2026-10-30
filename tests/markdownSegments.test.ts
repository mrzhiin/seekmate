import assert from "node:assert/strict";
import test from "node:test";
import { parseMarkdownSegments } from "@/lib/renderer/markdownSegments";

test("preserves code indentation and hard line breaks at segment boundaries", () => {
	const code = "    const answer = 42;\n    console.log(answer);";
	assert.deepEqual(parseMarkdownSegments(code), [
		{ type: "markdown", content: code },
	]);
	const hardBreak =
		"text  \n:::: tabs\n::: tab-item Example\ncontent\n:::\n::::";
	assert.deepEqual(parseMarkdownSegments(hardBreak)[0], {
		type: "markdown",
		content: "text  ",
	});
});

test("preserves indentation inside tabs and surrounding paragraphs", () => {
	const source =
		"\n    before\n\n:::: tabs\n::: tab-item Code\n\n    inside\n\n:::\n::::\n\n    after\n";
	assert.deepEqual(parseMarkdownSegments(source), [
		{ type: "markdown", content: "    before" },
		{ type: "tabs", tabs: [{ title: "Code", content: "    inside" }] },
		{ type: "markdown", content: "    after" },
	]);
});

for (const fence of ["```", "~~~~"]) {
	test(`tab markers inside ${fence} code fences remain literal`, () => {
		const source = `${fence}\n:::: tabs\n::: tab-item Fake\nvalue\n:::\n::::\n${fence}`;
		assert.deepEqual(parseMarkdownSegments(source), [
			{ type: "markdown", content: source },
		]);
	});
}

test("malformed tabs keep their original content instead of silently dropping it", () => {
	for (const source of [
		":::: tabs\n::: tab-item Open\ncontent",
		":::: tabs\nunowned content\n::: tab-item Valid\ncontent\n:::\n::::",
		":::: tabs\n::::",
	]) {
		assert.deepEqual(parseMarkdownSegments(source), [
			{ type: "markdown", content: source },
		]);
	}
});

test("normalizes CRLF and skips whitespace-only documents", () => {
	assert.deepEqual(parseMarkdownSegments("\r\n    code\r\n"), [
		{ type: "markdown", content: "    code" },
	]);
	assert.deepEqual(parseMarkdownSegments(" \n\t\r\n"), []);
});
