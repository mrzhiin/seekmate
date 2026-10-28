import { FloatingActionButton, Host, Icon } from "@expo/ui/jetpack-compose";
import { clip, Shapes } from "@expo/ui/jetpack-compose/modifiers";
import RNMaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Header } from "@react-navigation/elements";
import {
	createMaterialTopTabNavigator,
	type MaterialTopTabScreenProps,
} from "@react-navigation/material-top-tabs";
import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView as RNScreensSafeAreaView } from "react-native-screens/experimental";
import { useResolveClassNames } from "uniwind";
import { useStore } from "zustand";
import { PostList } from "@/components/post/postList";
import { Pressable } from "@/components/pressable";
import { TrueSheetMenu } from "@/components/trueSheet";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { useCSSVariableString } from "@/hooks/useStyle";
import { ScreenName } from "@/stack/screenName";
import { CategoriesStore } from "@/store/categoriesStore";
import { userStore } from "@/store/userStore";

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

const fabIconSource = RNMaterialDesignIcons.getImageSourceSync(
	"note-plus-outline",
	24,
);

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
	const fabHostStyle = useResolveClassNames("absolute bottom-6 right-6");
	const primaryColor = useCSSVariableString("--color-primary");
	const secondaryForegroundColor = useCSSVariableString(
		"--color-secondary-foreground",
	);
	const borderColor = useCSSVariableString("--color-border");
	const primaryForegroundColor = useCSSVariableString(
		"--color-primary-foreground",
	);
	const userId = useStore(userStore, (s) => s.id);

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
			className=""
		>
			<Header
				title={t("common.appName")}
				headerShadowVisible={false}
				headerTitleStyle={{ fontSize: 22, fontWeight: "600" }}
				headerRight={() => {
					return (
						<View className="mr-4 overflow-hidden rounded-full bg-secondary">
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={t("search.placeholder")}
								className="items-center justify-center"
								style={{
									height: 48,
									aspectRatio: 1,
								}}
								onPress={() => {
									navigation.navigate(ScreenName.Search);
								}}
							>
								<MaterialDesignIcons name="magnify" size={24} />
							</Pressable>
						</View>
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
						fontWeight: "600",
						textTransform: "none",
					},
					tabBarActiveTintColor: primaryColor,
					tabBarInactiveTintColor: secondaryForegroundColor,
					tabBarIndicatorStyle: {
						height: 3,
						borderTopLeftRadius: 3,
						borderTopRightRadius: 3,
					},
					tabBarStyle: {
						elevation: 0,
						borderBottomWidth: 1,
						borderBottomColor: borderColor,
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
			{userId ? (
				<Host matchContents pointerEvents="box-only" style={fabHostStyle}>
					<FloatingActionButton
						containerColor={primaryColor}
						modifiers={[clip(Shapes.Circle)]}
						onClick={() => {
							navigation.navigate(ScreenName.PostNew);
						}}
					>
						<FloatingActionButton.Icon>
							<Icon
								source={{ uri: fabIconSource.uri }}
								size={24}
								tint={primaryForegroundColor}
							/>
						</FloatingActionButton.Icon>
					</FloatingActionButton>
				</Host>
			) : null}
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
