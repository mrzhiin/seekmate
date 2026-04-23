import { Directory, Paths } from "expo-file-system";
import { createMMKV } from "react-native-mmkv";

export const mmkvStorage = createMMKV();

export const StorageKey = {
	ZustandStoreUser: "zustand:store:user",
	ZustandStoreApp: "zustand:store:app",
	ZustandStoreCategories: "zustand:store:categories",
	SearchKeywords: "search:keywords",
} as const;

const mmkvCacheStoragePathDirectory = new Directory(Paths.cache, "mmkv");

export const mmkvCacheStorage = createMMKV({
	id: "cache",
	path: mmkvCacheStoragePathDirectory.uri.replace("file://", ""),
});
