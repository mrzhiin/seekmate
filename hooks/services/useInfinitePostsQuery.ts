import { useInfiniteQuery } from "@tanstack/react-query";
import { useStore } from "zustand";
import { config } from "@/lib/config";
import { nsClient } from "@/lib/http/client";
import { parsePageHtml } from "@/lib/parser";
import { userStore } from "@/store/userStore";

export const useInfinitePostsQuery = ({
	sortBy = "postTime",
	category,
}: {
	sortBy?: "replyTime" | "postTime";
	category?: string;
}) => {
	const userId = useStore(userStore, (s) => s.id);
	const queryKey = ["posts", "infinite", userId, sortBy, category] as const;

	const result = useInfiniteQuery({
		queryKey,
		queryFn: async ({ pageParam, signal }) => {
			const params = new URLSearchParams();
			if (pageParam.sortBy && !category) {
				params.set("sortBy", pageParam.sortBy);
			}
			const res = await nsClient(
				`${category ? `categories/${category}/` : ""}page-${pageParam.currentPage}?${params}`,
				{ baseURL: config.siteUrl, signal },
			);

			const htmlString = await res.text();
			const pageJSONData = parsePageHtml(htmlString);
			return pageJSONData;
		},
		initialPageParam: { currentPage: 1, sortBy },
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.pagination.hasNext) {
				return { currentPage: lastPageParam.currentPage + 1, sortBy };
			}
			return undefined;
		},
	});

	return {
		...result,
		queryKey,
	};
};

export const useSearchInfinitePostsQuery = ({
	keyword,
}: {
	keyword?: string;
}) => {
	const userId = useStore(userStore, (s) => s.id);
	const queryKey = ["search", keyword, userId] as const;
	const result = useInfiniteQuery({
		enabled: Boolean(keyword),
		retry: false,
		queryKey,
		queryFn: async ({ pageParam, signal }) => {
			const params = new URLSearchParams({
				page: pageParam.currentPage.toString(),
				q: keyword || "",
			});
			const res = await nsClient(`search?${params}`, {
				baseURL: config.siteUrl,
				signal,
			});

			const htmlString = await res.text();
			const pageJSONData = parsePageHtml(htmlString);
			return pageJSONData;
		},
		initialPageParam: { currentPage: 1 },
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.pagination.hasNext) {
				return { currentPage: lastPageParam.currentPage + 1 };
			}
			return undefined;
		},
	});

	return {
		...result,
		queryKey,
	};
};
