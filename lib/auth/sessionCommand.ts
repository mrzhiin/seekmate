import NitroCookies from "react-native-nitro-cookies";
import { asyncStoragePersister, queryClient } from "@/lib/query";
import { userDataStore } from "@/store/userDataStore";
import { userStore } from "@/store/userStore";

let signOutPromise: Promise<void> | undefined;
let cleanupError: unknown;

export const waitForSessionCleanup = async () => {
	await signOutPromise;
	if (cleanupError) throw cleanupError;
};

export const signInUserSession = async (
	userId: number,
	signal?: AbortSignal,
) => {
	await waitForSessionCleanup();
	if (signal?.aborted) return;
	if (!Number.isSafeInteger(userId) || userId <= 0)
		throw new Error("Invalid user id");
	if (userStore.getState().id !== userId) queryClient.clear();
	userDataStore.getState().reset();
	userStore.getState().update({ id: userId, name: undefined });
};

export const signOutUserSession = (): Promise<void> => {
	if (signOutPromise) return signOutPromise;

	cleanupError = undefined;
	// Reset immediately to stop accepting work for the old session.
	userStore.getState().reset();
	userDataStore.getState().reset();
	queryClient.clear();
	signOutPromise = Promise.all([
		NitroCookies.clearAll().then(async (cleared) => {
			if (!cleared) throw new Error("Cookie cleanup failed");
			await NitroCookies.flush();
		}),
		asyncStoragePersister.removeClient(),
	])
		.then(() => {})
		.catch((error: unknown) => {
			cleanupError =
				error instanceof Error ? error : new Error("Session cleanup failed");
			throw cleanupError;
		})
		.finally(() => {
			signOutPromise = undefined;
		});
	return signOutPromise;
};
