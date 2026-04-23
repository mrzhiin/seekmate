import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "zustand";
import { Sort } from "@/components/categories/sort";
import { CategoriesStore, type PinnedCategory } from "@/store/categoriesStore";

const Screen = () => {
	const navigation = useNavigation();
	const { t } = useTranslation();
	const pinnedCategories = useStore(CategoriesStore, (s) => s.pinnedCategories);
	const setPinnedCategories = useStore(
		CategoriesStore,
		(s) => s.setPinnedCategories,
	);
	const [draftItems, setDraftItems] =
		useState<PinnedCategory[]>(pinnedCategories);
	const draftItemsRef = useRef(draftItems);
	const isDirtyRef = useRef(false);

	useEffect(() => {
		draftItemsRef.current = draftItems;
	}, [draftItems]);

	useEffect(() => {
		if (!isDirtyRef.current) {
			setDraftItems(pinnedCategories);
		}
	}, [pinnedCategories]);

	useEffect(() => {
		navigation.setOptions({
			title: t("categoriesSort.title"),
		});
	}, [navigation, t]);

	useFocusEffect(
		useCallback(() => {
			isDirtyRef.current = false;
			setDraftItems(CategoriesStore.getState().pinnedCategories);

			return () => {
				if (isDirtyRef.current) {
					setPinnedCategories(draftItemsRef.current);
				}
			};
		}, [setPinnedCategories]),
	);

	return (
		<SafeAreaView
			edges={["bottom"]}
			style={{
				flex: 1,
			}}
		>
			<Sort
				items={draftItems}
				onChange={(nextItems) => {
					isDirtyRef.current = true;
					setDraftItems(nextItems);
				}}
			/>
		</SafeAreaView>
	);
};

export default Screen;
