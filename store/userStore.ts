import { createStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { StorageKey } from "@/lib/storage";
import { createCustomStorage } from "./util";

type State = {
	id?: number;
	name?: string;
};

type Action = {
	update: (e: Partial<State>) => void;
	reset: () => void;
};

const createInitialState = (): State => {
	return {
		id: undefined,
		name: undefined,
	};
};

export const userStore = createStore<State & Action>()(
	persist(
		(set) => {
			return {
				...createInitialState(),
				update: (state) => {
					set(state);
				},
				reset: () => {
					set(createInitialState());
				},
			};
		},
		{
			version: 0,
			name: StorageKey.ZustandStoreUser,
			storage: createJSONStorage(() => {
				return createCustomStorage();
			}),
		},
	),
);
