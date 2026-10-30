import { useInfiniteQuery } from "@tanstack/react-query";
import { useStore } from "zustand";
import { config } from "@/lib/config";
import { nsClient } from "@/lib/http/client";
import { parsePostPageHtml } from "@/lib/parser";
import {
	type PostInfiniteCommentsPage,
	postInfiniteCommentsQueryKey,
} from "@/lib/query/postComments";
import { userStore } from "@/store/userStore";

export const fetchPostCommentsPage = async ({
	postId,
	currentPage,
	signal,
}: {
	postId: number;
	currentPage: number;
	signal?: AbortSignal;
}) => {
	const res = await nsClient(`post-${postId}-${currentPage}`, {
		baseURL: config.siteUrl,
		signal,
	});

	const htmlString = await res.text();
	const postPageJSONData = parsePostPageHtml(htmlString);

	return {
		id: postPageJSONData.id,
		comments: postPageJSONData.comments,
		pagination: postPageJSONData.pagination,
	};
};

export const usePostInfiniteCommentsQuery = ({
	postId,
	initialPage,
}: {
	postId: number;
	initialPage: PostInfiniteCommentsPage;
}) => {
	const userId = useStore(userStore, (s) => s.id);
	const result = useInfiniteQuery({
		enabled: Boolean(postId),
		queryKey: postInfiniteCommentsQueryKey(postId, userId),
		queryFn: async ({ pageParam, signal }) => {
			return fetchPostCommentsPage({
				postId,
				currentPage: pageParam.currentPage,
				signal,
			});
		},
		initialPageParam: { currentPage: 1 },
		initialData: {
			pages: [initialPage],
			pageParams: [{ currentPage: 1 }],
		},
		refetchOnMount: (query) => query.state.data?.pages[0] !== initialPage,
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.pagination.hasNext) {
				return { currentPage: lastPageParam.currentPage + 1 };
			}

			return undefined;
		},
	});

	return result;
};
