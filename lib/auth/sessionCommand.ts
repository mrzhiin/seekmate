import { userStore } from "@/store/userStore";

export const signInUserSession = (userId: number) => {
	userStore.getState().update({
		id: userId,
	});
};

export const signOutUserSession = () => {
	userStore.getState().reset();
};

export const resetUserSessionFromAuthError = () => {
	signOutUserSession();
};
