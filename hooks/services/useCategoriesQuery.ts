import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import * as v from "valibot";
import { useStore } from "zustand";
import { nsClient } from "@/lib/http/client";
import { userStore } from "@/store/userStore";

const SuccessResSchema = v.object({
	success: v.literal(true),
	data: v.array(
		v.object({
			key: v.string(),
			cn_text: v.string(),
		}),
	),
});

export const useCategoriesQuery = () => {
	const userId = useStore(userStore, (s) => s.id);
	const result = useQuery({
		queryKey: ["api/content/list-categories", userId],
		queryFn: async () => {
			const res = await nsClient.get("api/content/list-categories");
			const resData = res.data;
			const result = v.safeParse(SuccessResSchema, resData);

			if (result.success) {
				const data = result.output.data;

				return data.map((x) => {
					return {
						slug: x.key,
						nameZh: x.cn_text,
					};
				});
			}

			throw new Error("API getInfo fail");
		},
	});

	return result;
};

export const useCategoriesSuspenseQuery = () => {
	const userId = useStore(userStore, (s) => s.id);
	const result = useSuspenseQuery({
		queryKey: ["api/content/list-categories", userId],
		queryFn: async () => {
			const res = await nsClient.get("api/content/list-categories");
			const resData = res.data;
			const result = v.safeParse(SuccessResSchema, resData);

			if (result.success) {
				const data = result.output.data;

				return data.map((x) => {
					return {
						slug: x.key,
						nameZh: x.cn_text,
					};
				});
			}

			throw new Error("API getInfo fail");
		},
	});

	return result;
};
