import { useInfiniteQuery } from "@tanstack/react-query";
import { useStore } from "zustand";
import { config } from "@/lib/config";
import { nsClient } from "@/lib/http/client";
import { parsePostPageHtml } from "@/lib/parser";
import { userStore } from "@/store/userStore";

export const postInfiniteCommentsQueryKey = (
	postId: number,
	userId: number | undefined,
) => ["post", postId, "comments", "infinite", userId] as const;

export const fetchPostCommentsPage = async ({
	postId,
	currentPage,
	signal,
}: {
	postId: number;
	currentPage: number;
	signal?: AbortSignal;
}) => {
	const res = await nsClient.get(`post-${postId}-${currentPage}`, {
		baseURL: config.siteUrl,
		signal,
	});

	const htmlString = res.data;
	const postPageJSONData = parsePostPageHtml(htmlString);

	return {
		id: postPageJSONData.id,
		comments: postPageJSONData.comments,
		pagination: postPageJSONData.pagination,
	};
};

export type PostInfiniteCommentsPage = Awaited<
	ReturnType<typeof fetchPostCommentsPage>
>;

export const usePostInfiniteCommentsQuery = ({
	postId,
}: {
	postId: number;
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
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.pagination.hasNext) {
				return { currentPage: lastPageParam.currentPage + 1 };
			}

			return undefined;
		},
	});

	return result;
};
