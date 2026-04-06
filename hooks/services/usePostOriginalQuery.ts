import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useStore } from "zustand";
import { config } from "@/lib/config";
import { nsClient } from "@/lib/http/client";
import { parsePostPageHtml } from "@/lib/parser";
import { userStore } from "@/store/userStore";

export const usePostOriginalQueryKey = ({ postId }: { postId: number }) => {
	const userId = useStore(userStore, (s) => s.id);
	return useMemo(() => {
		return ["post", postId, "original", userId];
	}, [postId, userId]);
};

export const usePostOriginalQuery = ({ postId }: { postId: number }) => {
	const queryKey = usePostOriginalQueryKey({ postId });
	const result = useQuery({
		enabled: Boolean(postId),
		queryKey,
		queryFn: async () => {
			const res = await nsClient.get(`post-${postId}-1`, {
				baseURL: config.siteUrl,
			});

			const htmlString = res.data;
			const postPageJSONData = parsePostPageHtml(htmlString);
			return postPageJSONData;
		},
	});

	return result;
};
