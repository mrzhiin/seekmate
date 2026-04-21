import { generateKeyBetween } from "jittered-fractional-indexing";
import * as v from "valibot";
import { createStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Category } from "@/lib/parser/types";
import { CategorySchema } from "@/lib/parser/validation";
import { StorageKey } from "@/lib/storage";
import { createCustomStorage } from "./util";

const PinnedCategorySchema = v.object({
	nameZh: v.string(),
	slug: v.pipe(v.string(), v.trim(), v.nonEmpty()),
	sort: v.pipe(v.string(), v.trim(), v.nonEmpty()),
});

export type PinnedCategory = v.InferOutput<typeof PinnedCategorySchema>;

type State = {
	categories: Category[];
	pinnedCategories: PinnedCategory[];
};

type Action = {
	setCategories: (categories: Category[]) => void;
	setPinnedCategories: (categories: PinnedCategory[]) => void;
	pinCategory: (slug: string) => void;
	unpinCategory: (slug: string) => void;
	isPinnedCategory: (slug: string) => boolean;
	getCategory: (slug: string) => Category | undefined;
	reset: () => void;
};

const normalizeCategories = (categories: unknown): Category[] => {
	if (Array.isArray(categories)) {
		const map = new Map<string, Category>();

		for (const category of categories) {
			const result = v.safeParse(CategorySchema, category);
			if (result.success) {
				map.set(result.output.slug, result.output);
			}
		}

		return [...map.values()];
	}

	return [];
};

const normalizePinnedCategories = (categories: unknown): PinnedCategory[] => {
	if (Array.isArray(categories)) {
		const map = new Map<string, PinnedCategory>();

		for (const category of categories) {
			const result = v.safeParse(PinnedCategorySchema, category);
			if (result.success) {
				map.set(result.output.slug, result.output);
			}
		}

		return [...map.values()].sort((a, b) => {
			if (a.sort < b.sort) {
				return -1;
			} else if (a.sort > b.sort) {
				return 1;
			} else {
				return 0;
			}
		});
	}

	return [];
};

const createPinnedCategory = (
	category: Category,
	sort: string,
): PinnedCategory => {
	return {
		nameZh: category.nameZh,
		slug: category.slug,
		sort,
	};
};

const createInitialState = (): State => {
	return {
		categories: [],
		pinnedCategories: [],
	};
};

export const CategoriesStore = createStore<State & Action>()(
	persist(
		(set, get) => {
			return {
				...createInitialState(),
				setCategories: (categories) => {
					const nextCategories = normalizeCategories(categories);
					const nextCategorySlugMap = new Map(
						nextCategories.map((category) => [category.slug, category]),
					);
					set({
						categories: nextCategories,
						pinnedCategories: normalizePinnedCategories(
							get()
								.pinnedCategories.map((item) => {
									const nextCategory = nextCategorySlugMap.get(item.slug);
									return nextCategory
										? createPinnedCategory(nextCategory, item.sort)
										: null;
								})
								.filter((x) => x !== null),
						),
					});
				},
				setPinnedCategories: (categories) => {
					set({ pinnedCategories: normalizePinnedCategories(categories) });
				},
				pinCategory: (slug) => {
					const category = get().getCategory(slug);

					if (!category || get().isPinnedCategory(slug)) {
						return;
					}

					const pinnedCategories = get().pinnedCategories;

					set({
						pinnedCategories: normalizePinnedCategories([
							...pinnedCategories,
							createPinnedCategory(
								category,
								generateKeyBetween(pinnedCategories.at(-1)?.sort, null),
							),
						]),
					});
				},
				unpinCategory: (slug) => {
					set({
						pinnedCategories: get().pinnedCategories.filter(
							(item) => item.slug !== slug,
						),
					});
				},
				isPinnedCategory: (slug) => {
					return get().pinnedCategories.some((item) => item.slug === slug);
				},
				getCategory: (slug) => {
					return get().categories.find((category) => category.slug === slug);
				},
				reset: () => {
					set(createInitialState());
				},
			};
		},
		{
			version: 0,
			name: StorageKey.ZustandStoreCategories,
			storage: createJSONStorage(() => {
				return createCustomStorage();
			}),
			partialize: (state) => {
				return {
					categories: state.categories,
					pinnedCategories: state.pinnedCategories,
				};
			},
			onRehydrateStorage: () => {
				return (state) => {
					if (!state) {
						return;
					}

					state.categories = normalizeCategories(state.categories);
					state.pinnedCategories = normalizePinnedCategories(
						state.pinnedCategories,
					);
				};
			},
		},
	),
);
