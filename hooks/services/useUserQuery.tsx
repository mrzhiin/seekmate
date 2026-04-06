import { useSuspenseQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as v from "valibot";
import { nsClient } from "@/lib/http/client";

const UserResSchema = v.object({
	member_id: v.number(),
	member_name: v.string(),
	// isAdmin: 0,
	rank: v.number(),
	coin: v.number(),
	collectionCount: v.optional(v.number()),
	stardust: v.number(),
	// bio: null,
	created_at: v.string(),
	nPost: v.number(),
	nComment: v.number(),
	follows: v.number(),
	fans: v.number(),
	// created_at_str: "1009days ago",
	// roles: [],
});

const UserSuccessResSchema = v.object({
	success: v.literal(true),
	detail: UserResSchema,
});

const _UserErrorResSchema = v.object({
	success: v.literal(false),
	message: v.nullish(v.string()),
});

export const useUserSuspenseQuery = (uid: number) => {
	const result = useSuspenseQuery({
		queryKey: ["api/account/getInfo/", uid],
		queryFn: async () => {
			const res = await nsClient.get(`api/account/getInfo/${uid}`);
			const resData = res.data;
			const result = v.safeParse(UserSuccessResSchema, resData);

			if (!result.success) {
				throw new Error("API getInfo fail");
			}

			const detail = result.output.detail;

			return {
				uid: detail.member_id,
				name: detail.member_name,
				rank: detail.rank,
				createdAt: dayjs(detail.created_at).valueOf(),
				coinCount: detail.coin,
				stardustCount: detail.stardust,
				postCount: detail.nPost,
				commentCount: detail.nComment,
				favoriteCount: detail.collectionCount,
				followingCount: detail.follows,
				followerCount: detail.fans,
			};
		},
	});

	return result;
};
