import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { PostPageData } from "@/lib/parser";

export type PostInfiniteCommentsPage = Pick<
	PostPageData,
	"id" | "comments" | "pagination"
>;
export type PostCommentsData = InfiniteData<
	PostInfiniteCommentsPage,
	{ currentPage: number }
>;

export const postInfiniteCommentsQueryKey = (
	postId: number,
	userId: number | undefined,
) => ["post", postId, "comments", "infinite", userId] as const;

type CommentsQueryKey = ReturnType<typeof postInfiniteCommentsQueryKey>;

export function syncPostCommentsFirstPage(
	client: QueryClient,
	queryKey: CommentsQueryKey,
	page: PostInfiniteCommentsPage,
) {
	client.setQueryData<PostCommentsData>(queryKey, (prev) =>
		prev
			? {
					...prev,
					pages: prev.pages.map((existing) =>
						existing.pagination.currentPage === 1 ? page : existing,
					),
				}
			: undefined,
	);
}

export async function refreshPostCommentsTail(
	client: QueryClient,
	queryKey: CommentsQueryKey,
	fetchPage: (
		currentPage: number,
		signal: AbortSignal,
	) => Promise<PostInfiniteCommentsPage>,
) {
	const cachedData = client.getQueryData<PostCommentsData>(queryKey);
	const lastPage = cachedData?.pages.at(-1);
	const pageNumber = cachedData?.pageParams.at(-1)?.currentPage;

	if (!lastPage || !pageNumber) {
		await client.invalidateQueries({ queryKey, exact: true });
		return;
	}

	const requestPage = (currentPage: number) =>
		client.query({
			queryKey: [...queryKey, "refresh", currentPage],
			queryFn: ({ signal }) => fetchPage(currentPage, signal),
			gcTime: 0,
		});

	const page = await requestPage(pageNumber);
	let updated = false;

	client.setQueryData<PostCommentsData>(queryKey, (prev) => {
		if (!prev || prev.pages.at(-1) !== lastPage) return prev;
		updated = true;
		return { ...prev, pages: [...prev.pages.slice(0, -1), page] };
	});

	// shortcut: follow one new page; add jump-to-latest if multi-page catch-up is needed.
	if (!updated || lastPage.pagination.hasNext || !page.pagination.hasNext) {
		return;
	}

	const refreshedTail = client
		.getQueryData<PostCommentsData>(queryKey)
		?.pages.at(-1);
	const nextPage = await requestPage(pageNumber + 1);
	
	client.setQueryData<PostCommentsData>(queryKey, (prev) => {
		if (
			!prev ||
			prev.pages.at(-1) !== refreshedTail ||
			prev.pageParams.at(-1)?.currentPage !== pageNumber ||
			nextPage.pagination.currentPage !== pageNumber + 1
		)
			return prev;
		return {
			pages: [...prev.pages, nextPage],
			pageParams: [...prev.pageParams, { currentPage: pageNumber + 1 }],
		};
	});
}
