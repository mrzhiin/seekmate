import { useMutation } from "@tanstack/react-query";
import { useStore } from "zustand";
import { nsClient } from "@/lib/http/client";
import { userStore } from "@/store/userStore";

export const useRecordAttendanceMutation = () => {
	const userId = useStore(userStore, (s) => s.id);
	const mutation = useMutation({
		mutationKey: ["api/attendance", userId],
		mutationFn: async (params?: { isRandom?: boolean }) => {
			const random = params?.isRandom
				? Math.random().toString(36).substring(2, 15)
				: false;

			await nsClient.post(`api/attendance?random=${random}`);
		},
	});

	return mutation;
};
