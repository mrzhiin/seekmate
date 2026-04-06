import type { StateStorage } from "zustand/middleware";
import { mmkvStorage } from "@/lib/storage";

export const createCustomStorage = (): StateStorage => {
	return {
		setItem: (name, value) => {
			return mmkvStorage.set(name, value);
		},
		getItem: (name) => {
			const value = mmkvStorage.getString(name);
			return value ?? null;
		},
		removeItem: (name) => {
			return mmkvStorage.remove(name);
		},
	};
};
