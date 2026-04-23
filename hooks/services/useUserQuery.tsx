import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import PQueue from "p-queue";
import * as v from "valibot";
import { nsClient } from "@/lib/http/client";

const queue = new PQueue({
	concurrency: 2,
	intervalCap: 2,
	interval: 1000,
	carryoverIntervalCount: true,
});
const ONE_HOUR_MS = 1000 * 60 * 60;

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

export const useRashUserQuery = (uid: number, enabled = true) => {
	return useQuery({
		enabled,
		staleTime: ONE_HOUR_MS,
		gcTime: ONE_HOUR_MS,
		meta: {
			persist: true,
		},
		queryKey: ["rash", "api/account/getInfo/", uid],
		queryFn: () => {
			return queue.add(async () => {
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
			});
		},
	});
};
