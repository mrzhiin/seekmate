import assert from "node:assert/strict";
import test from "node:test";
import {
	InfiniteQueryObserver,
	QueryClient,
	QueryObserver,
} from "@tanstack/react-query";
import {
	type PostCommentsData,
	type PostInfiniteCommentsPage,
	postInfiniteCommentsQueryKey,
	refreshPostCommentsTail,
	syncPostCommentsFirstPage,
} from "@/lib/query/postComments";

const key = postInfiniteCommentsQueryKey(1, 42);
const originalKey = ["post", 1, "original", 42];
const page = (
	currentPage: number,
	totalPages = currentPage,
): PostInfiniteCommentsPage => ({
	id: 1,
	comments: [
		{
			id: currentPage,
			floor: currentPage,
			author: { uid: 42, name: "tester" },
			contentMarkdown: `Comment on page ${currentPage}`,
			createdAt: 1,
			isHot: false,
			isPinned: false,
			isBlocked: false,
			isPoster: false,
			interactions: {
				upvoteCount: 0,
				isUpvoted: false,
				downvoteCount: 0,
				isDownvoted: false,
				appreciationCount: 0,
				isAppreciated: false,
				favoriteCount: 0,
				isFavorited: false,
			},
		},
	],
	pagination: {
		currentPage,
		totalPages,
		hasNext: currentPage < totalPages,
		hasPrev: currentPage > 1,
		pageSize: 20,
	},
});
const data = (...pages: PostInfiniteCommentsPage[]): PostCommentsData => ({
	pages,
	pageParams: pages.map((page) => ({
		currentPage: page.pagination.currentPage,
	})),
});
const createClient = () =>
	new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: Infinity } },
	});

// Same mount sequence as the post screen: cached original, comments, then background original refresh.
test("reuse the initial page without a request, then sync it on reopening", async (t) => {
	const client = createClient();
	t.after(() => client.clear());
	const oldPage = page(1);
	const newPage = page(1);
	newPage.comments.push({
		...newPage.comments[0],
		id: 99,
		floor: 2,
		contentMarkdown: "New reply",
	});
	client.setQueryData(originalKey, oldPage);
	let commentFetches = 0;
	const options = (initialPage: PostInfiniteCommentsPage) => ({
		queryKey: key,
		queryFn: async () => {
			commentFetches++;
			return newPage;
		},
		initialPageParam: { currentPage: 1 },
		initialData: data(initialPage),
		refetchOnMount: (query: { state: { data?: PostCommentsData } }) =>
			query.state.data?.pages[0] !== initialPage,
		getNextPageParam: () => undefined,
	});
	const first = new InfiniteQueryObserver(client, options(oldPage));
	first.subscribe(() => {})();
	assert.equal(commentFetches, 0);
	let resolve!: (value: PostInfiniteCommentsPage) => void;
	const request = new Promise<PostInfiniteCommentsPage>((done) => {
		resolve = done;
	});
	const original = new QueryObserver(client, {
		queryKey: originalKey,
		queryFn: async () => {
			const result = await request;
			syncPostCommentsFirstPage(client, key, result);
			return result;
		},
	});
	t.after(original.subscribe(() => {}));
	const reopened = new InfiniteQueryObserver(client, options(oldPage));
	t.after(reopened.subscribe(() => {}));
	resolve(newPage);
	await original.refetch({ cancelRefetch: false });
	const refreshed = original.getCurrentResult().data;
	assert.ok(refreshed);
	reopened.setOptions(options(refreshed));
	assert.equal(commentFetches, 0);
	assert.deepEqual(reopened.getCurrentResult().data?.pages[0], newPage);
	assert.equal(reopened.getCurrentResult().data?.pages[0].comments.length, 2);
});

test("sync keeps loaded later pages and does not recreate a cleared session cache", (t) => {
	const client = createClient();
	t.after(() => client.clear());
	client.setQueryData(key, data(page(1, 2), page(2)));
	const previous = client.getQueryData<PostCommentsData>(key);
	assert.ok(previous);
	syncPostCommentsFirstPage(client, key, page(1, 3));
	const current = client.getQueryData<PostCommentsData>(key);
	assert.ok(current);
	assert.equal(current.pages[0].pagination.totalPages, 3);
	assert.equal(current.pages[1], previous.pages[1]);
	assert.equal(current.pageParams, previous.pageParams);
	client.removeQueries({ queryKey: key });
	syncPostCommentsFirstPage(client, key, page(1));
	assert.equal(client.getQueryData(key), undefined);
});

test("background errors retain content and are not loading errors; initial errors are", async (t) => {
	const client = createClient();
	t.after(() => client.clear());
	const initialPage = page(1);
	client.setQueryData(originalKey, initialPage);
	const options = {
		queryKey: originalKey,
		queryFn: async () => {
			throw new Error("offline");
		},
	};
	const observer = new QueryObserver(client, options);
	await observer.refetch();
	assert.equal(observer.getCurrentResult().isError, true);
	assert.equal(observer.getCurrentResult().isLoadingError, false);
	assert.deepEqual(observer.getCurrentResult().data, initialPage);
	const empty = new QueryObserver(client, {
		...options,
		queryKey: ["uncached"],
	});
	await empty.refetch();
	assert.equal(empty.getCurrentResult().isLoadingError, true);
});

for (const scenario of [
	{ name: "same page", oldTotal: 1, newTotal: 1, expected: [1] },
	{ name: "new boundary", oldTotal: 1, newTotal: 2, expected: [1, 2] },
	{
		name: "many new pages stay bounded",
		oldTotal: 1,
		newTotal: 100,
		expected: [1, 2],
	},
	{
		name: "unread pages are not eagerly fetched",
		oldTotal: 100,
		newTotal: 101,
		expected: [1],
	},
]) {
	test(`tail refresh: ${scenario.name}`, async (t) => {
		const client = createClient();
		t.after(() => client.clear());
		client.setQueryData(key, data(page(1, scenario.oldTotal)));
		const calls: number[] = [];
		await refreshPostCommentsTail(client, key, async (currentPage, signal) => {
			assert.equal(signal.aborted, false);
			calls.push(currentPage);
			return page(currentPage, scenario.newTotal);
		});
		assert.deepEqual(calls, scenario.expected);
		const current = client.getQueryData<PostCommentsData>(key);
		assert.ok(current);
		assert.deepEqual(
			current.pageParams.map((param) => param.currentPage),
			scenario.expected,
		);
		assert.equal(
			current.pages.at(-1)?.pagination.totalPages,
			scenario.newTotal,
		);
	});
}

test("tail refresh keeps earlier pages", async (t) => {
	const client = createClient();
	t.after(() => client.clear());
	client.setQueryData(key, data(page(1, 2), page(2)));
	const first = client.getQueryData<PostCommentsData>(key)?.pages[0];
	const calls: number[] = [];
	await refreshPostCommentsTail(client, key, async (currentPage) => {
		calls.push(currentPage);
		return page(currentPage, 3);
	});
	assert.deepEqual(calls, [2, 3]);
	assert.equal(client.getQueryData<PostCommentsData>(key)?.pages[0], first);
});

test("failed next-page refresh preserves loaded data and enables normal pagination", async (t) => {
	const client = createClient();
	t.after(() => client.clear());
	client.setQueryData(key, data(page(1)));
	await assert.rejects(
		refreshPostCommentsTail(client, key, async (currentPage) => {
			if (currentPage === 2) throw new Error("offline");
			return page(1, 2);
		}),
		/offline/,
	);
	const current = client.getQueryData<PostCommentsData>(key);
	assert.ok(current);
	assert.equal(current.pages.length, 1);
	assert.equal(current.pages[0].pagination.hasNext, true);
});

for (const phase of [1, 2]) {
	for (const change of ["clear", "refresh", "pagination"] as const) {
		test(`concurrent ${change} is preserved during tail request ${phase}`, async (t) => {
			const client = createClient();
			t.after(() => client.clear());
			client.setQueryData(key, data(page(1)));
			const replacement =
				change === "pagination"
					? data(page(1, 3), page(2, 3))
					: data(page(1, 5));
			await refreshPostCommentsTail(client, key, async (currentPage) => {
				if (currentPage === phase) {
					if (change === "clear")
						client.removeQueries({ queryKey: key, exact: true });
					else client.setQueryData(key, replacement);
				}
				return page(currentPage, 2);
			});
			assert.deepEqual(
				client.getQueryData(key),
				change === "clear" ? undefined : replacement,
			);
		});
	}
}
