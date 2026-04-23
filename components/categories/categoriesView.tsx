import { useNavigation, useScrollToTop } from "@react-navigation/native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { RefreshControl, ScrollView } from "react-native-gesture-handler";
import { useStore } from "zustand";
import { CategoryIcons } from "@/components/icon/CategoryIcon";
import { Pressable } from "@/components/pressable";
import { Text } from "@/components/ui/text";
import { useCategoriesSuspenseQuery } from "@/hooks/services/useCategoriesQuery";
import { useRefresh } from "@/hooks/useRefresh";
import { ScreenName } from "@/stack/screenName";
import { CategoriesStore } from "@/store/categoriesStore";
import { TrueSheetMenu } from "../trueSheet";

export const CategoriesView = () => {
	const navigation = useNavigation();
	const { t } = useTranslation();
	const scrollViewRef = useRef<ScrollView>(null);
	const { data, refetch } = useCategoriesSuspenseQuery();
	const { isRefreshing, refresh } = useRefresh(refetch);
	const trueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const [currentSlug, setCurrentSlug] = useState<string | null>(null);
	const pinCategory = useStore(CategoriesStore, (s) => s.pinCategory);
	const unpinCategory = useStore(CategoriesStore, (s) => s.unpinCategory);

	const isPinned = useStore(CategoriesStore, (s) => {
		return currentSlug ? s.isPinnedCategory(currentSlug) : false;
	});

	useScrollToTop(scrollViewRef);

	return (
		<ScrollView
			ref={scrollViewRef}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			className="flex-1"
			refreshControl={
				<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
			}
		>
			<View className="flex-row flex-wrap px-4">
				{data?.map((x) => {
					return (
						<View
							key={x.slug}
							className="p-0.5"
							style={{
								width: "50%",
							}}
						>
							<Pressable
								className="bg-muted  flex-row gap-4 p-4 items-center justify-between rounded-lg"
								onPress={() => {
									navigation.navigate(ScreenName.Posts, {
										category: x.slug,
									});
								}}
								onLongPress={() => {
									setCurrentSlug(x.slug);
									trueSheetMenuRef.current?.present();
								}}
							>
								<Text className="text-secondary-foreground">{x.nameZh}</Text>
								<CategoryIcons slug={x.slug} size={28} />
							</Pressable>
						</View>
					);
				})}
			</View>
			{/* <View className="px-4 mt-12 gap-4">
					<Text className="text-base">Recommended</Text>
					<Advertise />
				</View> */}
			<TrueSheetMenu
				ref={trueSheetMenuRef}
				menus={[
					{
						key: "pin",
						label: isPinned
							? t("tabs.categories.unpin")
							: t("tabs.categories.pin"),
						icon: isPinned ? "pin-off" : "pin-outline",
						checked: isPinned,
						onPress: () => {
							if (currentSlug) {
								if (isPinned) {
									unpinCategory(currentSlug);
								} else {
									pinCategory(currentSlug);
								}
							}
							trueSheetMenuRef.current?.dismiss();
						},
					},
				]}
			></TrueSheetMenu>
		</ScrollView>
	);
};
