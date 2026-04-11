import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { mmkvCacheStorage } from "../storage";

export const asyncStoragePersister = createAsyncStoragePersister({
	storage: {
		getItem: (key) => mmkvCacheStorage.getString(key),
		setItem: (key, value) => {
			mmkvCacheStorage.set(key, value);
		},
		removeItem: (key) => {
			mmkvCacheStorage.remove(key);
		},
	},
});

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			experimental_prefetchInRender: true,
			retry: false,
		},
	},
});

export { queryClient };
