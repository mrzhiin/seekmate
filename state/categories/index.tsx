import { useEffect } from "react";
import { useStore } from "zustand";
import { useCategoriesQuery } from "@/hooks/services/useCategoriesQuery";
import { CategoriesStore } from "@/store/categoriesStore";

export const CategoriesProvider = () => {
	const { data } = useCategoriesQuery();
	const setCategories = useStore(CategoriesStore, (s) => s.setCategories);

	useEffect(() => {
		if (data) {
			setCategories(data);
		}
	}, [data, setCategories]);

	return null;
};
