import { createStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { StorageKey } from "@/lib/storage";
import { createCustomStorage } from "./util";

export const CheckInType = {
	Random: "random",
	Fixed: "fixed",
} as const;

export type CheckInType = (typeof CheckInType)[keyof typeof CheckInType];

type State = {
	autoCheckIn: boolean;
	checkInType: CheckInType;
};

type Action = {
	update: (e: Partial<State>) => void;
};

const createInitialState = (): State => {
	return {
		autoCheckIn: false,
		checkInType: CheckInType.Fixed,
	};
};

export const appStore = createStore<State & Action>()(
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
			name: StorageKey.ZustandStoreApp,
			storage: createJSONStorage(() => {
				return createCustomStorage();
			}),
		},
	),
);
