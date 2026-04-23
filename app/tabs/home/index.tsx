import { Header } from "@react-navigation/elements";
import {
	createMaterialTopTabNavigator,
	type MaterialTopTabScreenProps,
} from "@react-navigation/material-top-tabs";
import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView as RNScreensSafeAreaView } from "react-native-screens/experimental";
import { useStore } from "zustand";
import { PostList } from "@/components/post/postList";
import { Pressable } from "@/components/pressable";
import { TrueSheetMenu } from "@/components/trueSheet";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { ScreenName } from "@/stack/screenName";
import { CategoriesStore } from "@/store/categoriesStore";

type HomeTabParams = Record<string, { category?: string } | undefined>;

const Tab = createMaterialTopTabNavigator<HomeTabParams>();

type CategoryPostsScreenProps = MaterialTopTabScreenProps<HomeTabParams>;

const CategoryPostsScreen = ({ route }: CategoryPostsScreenProps) => {
	const category = route.params?.category;

	if (!category) {
		return null;
	}

	return <PostList category={category} />;
};

const PostsSortByReplyTime = () => {
	return <PostList sortBy="replyTime" />;
};

const Screen = () => {
	const navigation = useNavigation();
	const { t } = useTranslation();
	const pinnedCategories = useStore(CategoriesStore, (s) => s.pinnedCategories);
	const unpinCategory = useStore(CategoriesStore, (s) => s.unpinCategory);
	const trueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const [currentSlug, setCurrentSlug] = useState<string | null>(null);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: false,
		});
	}, [navigation]);

	return (
		<RNScreensSafeAreaView
			edges={{
				top: false,
				bottom: true,
			}}
		>
			<Header
				title={t("common.appName")}
				headerShadowVisible={false}
				headerRight={() => {
					return (
						<Pressable
							className="mr-2 rounded-full justify-center items-center"
							style={{
								height: 40,
								aspectRatio: 1,
							}}
							onPress={() => {
								navigation.navigate(ScreenName.Search);
							}}
						>
							<MaterialDesignIcons name="magnify" size={24} />
						</Pressable>
					);
				}}
			/>
			<Tab.Navigator
				style={{
					flex: 1,
				}}
				screenOptions={{
					tabBarItemStyle: {
						width: pinnedCategories.length ? 128 : undefined,
					},
					tabBarLabelStyle: {
						fontSize: 16,
					},
					lazy: true,
					tabBarScrollEnabled: !!pinnedCategories.length,
				}}
			>
				<Tab.Screen
					name="newPosts"
					component={PostList}
					options={{ tabBarLabel: t("tabs.home.newPosts") }}
				/>
				<Tab.Screen
					name="newReplies"
					component={PostsSortByReplyTime}
					options={{ tabBarLabel: t("tabs.home.newReplies") }}
				/>
				{pinnedCategories.map((x) => {
					return (
						<Tab.Screen
							key={x.slug}
							name={x.slug}
							component={CategoryPostsScreen}
							initialParams={{
								category: x.slug,
							}}
							options={{ tabBarLabel: x.nameZh }}
							listeners={{
								tabLongPress: () => {
									setCurrentSlug(x.slug);
									trueSheetMenuRef.current?.present();
								},
							}}
						/>
					);
				})}
			</Tab.Navigator>
			<TrueSheetMenu
				ref={trueSheetMenuRef}
				menus={[
					{
						key: "unpin",
						label: t("tabs.categories.unpin"),
						icon: "pin-off",
						onPress: () => {
							if (currentSlug) {
								unpinCategory(currentSlug);
							}

							trueSheetMenuRef.current?.dismiss();
						},
					},
					{
						key: "sort",
						label: t("tabs.categories.sort"),
						icon: "format-list-bulleted",
						onPress: () => {
							navigation.navigate(ScreenName.CategoriesSort);
							trueSheetMenuRef.current?.dismiss();
						},
					},
				]}
			/>
		</RNScreensSafeAreaView>
	);
};

export default Screen;
