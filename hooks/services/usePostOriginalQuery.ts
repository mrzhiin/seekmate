import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useStore } from "zustand";
import { config } from "@/lib/config";
import { nsClient } from "@/lib/http/client";
import { parsePostPageHtml } from "@/lib/parser";
import {
	postInfiniteCommentsQueryKey,
	syncPostCommentsFirstPage,
} from "@/lib/query/postComments";
import { userStore } from "@/store/userStore";

export const usePostOriginalQueryKey = ({ postId }: { postId: number }) => {
	const userId = useStore(userStore, (s) => s.id);
	return useMemo(() => {
		return ["post", postId, "original", userId];
	}, [postId, userId]);
};

export const usePostOriginalQuery = ({ postId }: { postId: number }) => {
	const queryKey = usePostOriginalQueryKey({ postId });
	const queryClient = useQueryClient();
	const userId = useStore(userStore, (s) => s.id);
	const result = useQuery({
		enabled: Boolean(postId),
		queryKey,
		queryFn: async ({ signal }) => {
			const res = await nsClient(`post-${postId}-1`, {
				baseURL: config.siteUrl,
				signal,
			});

			const htmlString = await res.text();
			const postPageJSONData = parsePostPageHtml(htmlString);
			if (!signal.aborted && userStore.getState().id === userId) {
				syncPostCommentsFirstPage(
					queryClient,
					postInfiniteCommentsQueryKey(postId, userId),
					postPageJSONData,
				);
			}
			return postPageJSONData;
		},
	});

	return result;
};
