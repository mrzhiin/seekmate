import { readRemoteData } from "@/lib/userData/sync";
import { userDataStore } from "@/store/userDataStore";
import { userStore } from "@/store/userStore";

export const signInUserSession = async (
	userId: number,
	signal?: AbortSignal,
) => {
	signOutUserSession();

	try {
		const data = await readRemoteData(signal);

		if (signal?.aborted) {
			return;
		}

		userStore.getState().update({ id: userId });
		userDataStore.setState({ nodeImageApiKey: data.nodeImageApiKey });
	} catch (error) {
		if (!signal?.aborted) {
			signOutUserSession();
		}
		throw error;
	}
};

export const signOutUserSession = () => {
	userStore.getState().reset();
	userDataStore.getState().reset();
};
