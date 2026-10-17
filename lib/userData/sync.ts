import { userStore } from "@/store/userStore";
import { query, type UserData, update } from "./api";

export const readRemoteData = (signal?: AbortSignal): Promise<UserData> =>
	query(signal);

export const writeRemoteData = async (local: UserData) => {
	if (userStore.getState().id == null) {
		return;
	}

	try {
		await update(local);
	} catch {}
};
