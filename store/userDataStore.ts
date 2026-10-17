import * as v from "valibot";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { StorageKey } from "@/lib/storage";
import { writeRemoteData } from "@/lib/userData/sync";
import { createCustomStorage } from "@/store/util";

type State = {
	nodeImageApiKey: string;
};

type Action = {
	update: (state: Partial<State>) => void;
	reset: () => void;
};

export const createInitialState = (): State => ({
	nodeImageApiKey: "",
});

export const userDataStore = createStore<State & Action>()(
	persist(
		(set, get) => ({
			...createInitialState(),
			reset: () => set(createInitialState()),
			update: (state) => {
				set(state);
				const { nodeImageApiKey } = get();
				writeRemoteData({ nodeImageApiKey });
			},
		}),
		{
			version: 0,
			name: StorageKey.ZustandStoreUserData,
			storage: createJSONStorage(createCustomStorage),
			partialize: ({ nodeImageApiKey }) => ({ nodeImageApiKey }),
			merge: (persisted, current) => {
				const result = v.safeParse(
					v.object({ nodeImageApiKey: v.string() }),
					persisted,
				);
				return result.success
					? { ...current, nodeImageApiKey: result.output.nodeImageApiKey }
					: current;
			},
		},
	),
);
