import assert from "node:assert/strict";
import test from "node:test";
import type { PostScrollPosition } from "@/components/post/scrollMemory";
import { getPostScrollRestore } from "@/components/post/scrollRestore";

const saved: PostScrollPosition = {
	scrollOffset: 4000,
	headerSize: 700,
	anchor: { commentId: 50, floor: 50, page: 3, index: 49, viewOffset: -25 },
};
const firstPage = { currentPage: 1, hasNext: true };
const targetPage = { currentPage: 3, hasNext: true };

test("fresh visits do not restore or fetch extra pages", () => {
	assert.deepEqual(getPostScrollRestore(undefined, [], firstPage), {
		initialScrollIndex: undefined,
		initialScrollOffset: undefined,
		needsMorePages: false,
	});
});

test("positions inside the original post restore by pixel offset", () => {
	const result = getPostScrollRestore(
		{ scrollOffset: 300, headerSize: 700 },
		[],
		firstPage,
	);
	assert.equal(result.needsMorePages, false);
	assert.equal(result.initialScrollOffset, 300);
	assert.equal(result.initialScrollIndex, undefined);
});

test("missing cached pages must load before choosing the initial position", () => {
	for (const currentPage of [1, 2]) {
		const result = getPostScrollRestore(saved, [{ id: 1, floor: 1 }], {
			currentPage,
			hasNext: true,
		});
		assert.equal(result.needsMorePages, true);
		assert.equal(result.initialScrollIndex, undefined);
	}
	const result = getPostScrollRestore(
		saved,
		[
			{ id: 1, floor: 1 },
			{ id: 50, floor: 50 },
		],
		targetPage,
	);
	assert.equal(result.needsMorePages, false);
	assert.equal(result.initialScrollOffset, undefined);
	assert.deepEqual(result.initialScrollIndex, {
		index: 2,
		viewOffset: -25,
		viewPosition: 0,
	});
});

test("an exact anchor found earlier avoids unnecessary page requests", () => {
	const result = getPostScrollRestore(
		saved,
		[{ id: 50, floor: 50 }],
		firstPage,
	);
	assert.equal(result.needsMorePages, false);
	assert.equal(result.initialScrollIndex?.index, 1);
});

test("the original occupies index zero without changing the comment's viewport offset", () => {
	const result = getPostScrollRestore(
		{
			scrollOffset: 1200,
			headerSize: 700,
			anchor: { commentId: 1, floor: 1, page: 1, index: 0, viewOffset: -20 },
		},
		[{ id: 1, floor: 1 }],
		firstPage,
	);
	assert.deepEqual(result.initialScrollIndex, {
		index: 1,
		viewOffset: -20,
		viewPosition: 0,
	});
	assert.equal(result.initialScrollOffset, undefined);
});

test("a higher floor on an incomplete page must not replace the exact anchor", () => {
	const result = getPostScrollRestore(
		saved,
		[{ id: 90, floor: 90 }],
		firstPage,
	);
	assert.equal(result.needsMorePages, true);
	assert.equal(result.initialScrollIndex, undefined);
});

test("a deleted anchor falls back to the next floor after loading its page", () => {
	const result = getPostScrollRestore(
		saved,
		[
			{ id: 1, floor: 1 },
			{ id: 51, floor: 51 },
		],
		targetPage,
	);
	assert.equal(result.needsMorePages, false);
	assert.equal(result.initialScrollIndex?.index, 2);
});

test("a missing anchor stops at the saved page and falls back to pixels", () => {
	const result = getPostScrollRestore(saved, [{ id: 1, floor: 1 }], targetPage);
	assert.equal(result.needsMorePages, false);
	assert.equal(result.initialScrollIndex, undefined);
	assert.equal(result.initialScrollOffset, saved.scrollOffset);
});

test("a shortened thread stops at its last available page", () => {
	const result = getPostScrollRestore(saved, [], {
		currentPage: 1,
		hasNext: false,
	});
	assert.equal(result.needsMorePages, false);
	assert.equal(result.initialScrollOffset, saved.scrollOffset);
});

test("invalid anchors neither trigger pagination nor select a comment", () => {
	assert.ok(saved.anchor);
	for (const invalid of [
		{ page: 0 },
		{ page: -1 },
		{ page: 1.5 },
		{ page: Number.POSITIVE_INFINITY },
		{ commentId: Number.NaN },
		{ floor: Number.NaN },
		{ index: -1 },
		{ index: 1.5 },
		{ viewOffset: Number.NaN },
	]) {
		const result = getPostScrollRestore(
			{ ...saved, anchor: { ...saved.anchor, ...invalid } },
			[{ id: 50, floor: 50 }],
			firstPage,
		);
		assert.equal(result.needsMorePages, false);
		assert.equal(result.initialScrollIndex, undefined);
		assert.equal(result.initialScrollOffset, saved.scrollOffset);
	}
});

test("invalid pixel positions are ignored", () => {
	for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1, 0]) {
		const result = getPostScrollRestore(
			{ scrollOffset: value, headerSize: value },
			[],
			firstPage,
		);
		assert.equal(result.initialScrollOffset, undefined);
	}
	assert.equal(
		getPostScrollRestore({ scrollOffset: 1 }, [], firstPage)
			.initialScrollOffset,
		undefined,
	);
});
