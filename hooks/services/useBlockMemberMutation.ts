import { useMutation } from "@tanstack/react-query";
import { nsClient } from "@/lib/http/client";

export const useBlockMemberMutation = () => {
	const mutation = useMutation({
		mutationFn: async ({ userName }: { userName: string }) => {
			await nsClient.post(`api/block-list/add`, {
				block_member_name: userName,
			});
		},
	});

	return mutation;
};
