import { clearViewedPosts } from "@/lib/storage";

export const handleUserSessionChange = ({
	prevUserId,
	nextUserId,
}: {
	prevUserId?: number;
	nextUserId?: number;
}) => {
	if (prevUserId !== nextUserId) clearViewedPosts();
};
