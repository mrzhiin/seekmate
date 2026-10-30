import assert from "node:assert/strict";
import test from "node:test";
import { parsePageHtml } from "../lib/parser/parser";

const config = Buffer.from(
	JSON.stringify({
		allCategory: [],
		commmentPerPage: 20,
		enableCustomedStyle: false,
	}),
).toString("base64");

function page(currentPage: number, nextHref?: string, ellipsis = "") {
	return parsePageHtml(`
		<script id="temp-script">${config}</script>
		<div class="pager">
			<span class="pager-cur">${currentPage}</span>
			${currentPage > 1 ? '<span class="pager-prev"><a href="/page-1">prev</a></span>' : ""}
			${nextHref ? `<span class="pager-next"><a href="${nextHref}">next</a></span>` : ""}
			${ellipsis ? `<span class="pager-end"><a class="ellipsis">${ellipsis}</a></span>` : ""}
		</div>
	`).pagination;
}

for (const nextHref of [
	"/page-2",
	"/categories/general/page-2",
	"/search?q=test&amp;page=2",
	"/search?page=2&amp;q=test",
]) {
	test(`pagination detects next page without ellipsis: ${nextHref}`, () => {
		assert.deepEqual(page(1, nextHref), {
			currentPage: 1,
			totalPages: 2,
			hasNext: true,
			hasPrev: false,
			pageSize: 20,
		});
	});
}

test("last page keeps a consistent page count", () => {
	assert.deepEqual(page(3), {
		currentPage: 3,
		totalPages: 3,
		hasNext: false,
		hasPrev: true,
		pageSize: 20,
	});
});

test("ellipsis still supplies the final page", () => {
	assert.equal(page(1, "/page-2", "..100").totalPages, 100);
	assert.equal(page(1, undefined, "..100").hasNext, true);
});

test("placeholder, current and previous links are not next pages", () => {
	for (const href of ["#", "", "/page-3", "/page-2", "/search?page=2"]) {
		assert.equal(page(3, href).hasNext, false);
	}
});

test("missing and invalid page config still fail validation", () => {
	assert.throws(() => parsePageHtml(""), /No config script found/);
	assert.throws(
		() =>
			parsePageHtml(
				`<script id="temp-script">${Buffer.from("{}").toString("base64")}</script>`,
			),
		/Invalid page config/,
	);
});
