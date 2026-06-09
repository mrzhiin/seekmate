import { clearViewedPosts } from "@/lib/storage";

type SessionChangeParams = {
	prevUserId?: number;
	nextUserId?: number;
};

const clearUserSessionState = () => {
	clearViewedPosts();
};

export const handleUserSignedIn = () => {
	clearUserSessionState();
};

export const handleUserSignedOut = () => {
	clearUserSessionState();
};

export const handleUserSwitched = () => {
	clearUserSessionState();
};

export const handleUserSessionChange = ({
	prevUserId,
	nextUserId,
}: SessionChangeParams) => {
	if (prevUserId === nextUserId) {
		return;
	}

	if (prevUserId == null && nextUserId != null) {
		handleUserSignedIn();
		return;
	}

	if (prevUserId != null && nextUserId == null) {
		handleUserSignedOut();
		return;
	}

	if (prevUserId != null && nextUserId != null) {
		handleUserSwitched();
	}
};
