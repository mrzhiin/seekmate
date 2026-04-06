import { useInfiniteQuery } from "@tanstack/react-query";
import { config } from "@/lib/config";
import { nsClient } from "@/lib/http/client";
import { parsePostPageHtml } from "@/lib/parser";

export const postInfiniteCommentsQueryKey = (postId: number) =>
	["post", postId, "comments", "infinite"] as const;

export const fetchPostCommentsPage = async ({
	postId,
	currentPage,
}: {
	postId: number;
	currentPage: number;
}) => {
	const res = await nsClient.get(`post-${postId}-${currentPage}`, {
		baseURL: config.siteUrl,
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
	const result = useInfiniteQuery({
		enabled: Boolean(postId),
		queryKey: postInfiniteCommentsQueryKey(postId),
		queryFn: async ({ pageParam }) => {
			return fetchPostCommentsPage({
				postId,
				currentPage: pageParam.currentPage,
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
