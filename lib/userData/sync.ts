import { userStore } from "@/store/userStore";
import { query, type UserData, update } from "./api";

// 预留功能：用户配置远端同步，后续实现并接入登录和保存流程；当前未启用，请勿作为无用代码删除。
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
