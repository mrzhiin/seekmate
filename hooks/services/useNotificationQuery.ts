import { useQuery } from "@tanstack/react-query";
import * as v from "valibot";
import { useStore } from "zustand";
import { nsClient } from "@/lib/http/client";
import { userStore } from "@/store/userStore";

const _demo = {
	success: true,
	unreadCount: { message: 0, atMe: 0, reply: 0, all: 0 },
};

const SuccessResSchema = v.object({
	success: v.literal(true),
	unreadCount: v.object({
		message: v.number(),
		atMe: v.number(),
		reply: v.number(),
		all: v.number(),
	}),
});

export const useNotificationQuery = () => {
	const userId = useStore(userStore, (s) => s.id);
	const result = useQuery({
		enabled: Boolean(userId),
		queryKey: ["api/notification/unread-count", userId],
		queryFn: async ({ signal }) => {
			const res = await nsClient("api/notification/unread-count", {
				signal,
			});
			const resData: unknown = await res.json();
			const result = v.safeParse(SuccessResSchema, resData);

			if (result.success) {
				const data = result.output.unreadCount;

				return {
					unreadCount: Object.values(data).reduce((p, c) => {
						return p + c;
					}, 0),
				};
			} else {
				throw new Error("API fail");
			}
		},
	});

	return result;
};
