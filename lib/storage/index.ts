import { createMMKV } from "react-native-mmkv";

export const mmkvStorage = createMMKV();

export const StorageKey = {
	ZustandStoreUser: "zustand:store:user",
	ZustandStoreApp: "zustand:store:app",
	SearchKeywords: "search:keywords",
} as const;
