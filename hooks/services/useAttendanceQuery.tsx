import { useQuery } from "@tanstack/react-query";
import * as v from "valibot";
import { useStore } from "zustand";
import { nsClient } from "@/lib/http/client";
import { userStore } from "@/store/userStore";

const SuccessResSchema = v.object({
	record: v.nullish(
		v.object({
			id: v.number(),
			member_id: v.number(),
			day_id: v.number(),
			gain: v.number(),
			created_at: v.string(),
		}),
	),
});

export const getAttendanceQueryOptions = (userId: number) => {
	return {
		queryKey: ["api/attendance", userId] as const,
		queryFn: async () => {
			const res = await nsClient.get("api/attendance/board?page=1");
			const resData = res.data;
			const result = v.safeParse(SuccessResSchema, resData);

			if (result.success) {
				const data = result.output;

				if (data.record) {
					return {
						coins: data.record?.gain,
					};
				} else {
					return null;
				}
			} else {
				throw new Error("API fail");
			}
		},
	};
};

export const useAttendanceQuery = () => {
	const userId = useStore(userStore, (s) => s.id);
	const result = useQuery({
		...(userId
			? getAttendanceQueryOptions(userId)
			: {
					queryKey: ["api/attendance", userId] as const,
					queryFn: async () => null,
				}),
		enabled: Boolean(userId),
	});

	return result;
};
