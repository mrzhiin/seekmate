import { useMutation } from "@tanstack/react-query";
import { useStore } from "zustand";
import { nsClient } from "@/lib/http/client";
import { userStore } from "@/store/userStore";

export const useRecordAttendanceMutation = () => {
	const userId = useStore(userStore, (s) => s.id);
	const mutation = useMutation({
		mutationKey: ["api/attendance", userId],
		mutationFn: async (params?: { isRandom?: boolean }) => {
			const random = !!params?.isRandom;

			await nsClient.post(`api/attendance?random=${random}`);
		},
	});

	return mutation;
};
