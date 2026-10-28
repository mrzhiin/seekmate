import { Header } from "@react-navigation/elements";
import { useNavigation, useScrollToTop } from "@react-navigation/native";
import { type ComponentRef, useRef } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView as RNScreensSafeAreaView } from "react-native-screens/experimental";
import { useStore } from "zustand";
import { MineResolver } from "@/components/mine/mineResolver";
import type { MineViewRef } from "@/components/mine/mineView";
import { Pressable } from "@/components/pressable";
import { SignInPrompt } from "@/components/signInPrompt";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { useRefresh } from "@/hooks/useRefresh";
import { ScreenName } from "@/stack/screenName";
import { userStore } from "@/store/userStore";

const Screen = () => {
	const navigation = useNavigation();
	const uid = useStore(userStore, (s) => s.id);
	const { t } = useTranslation();
	const mineViewRef = useRef<MineViewRef>(null);
	const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);

	const { isRefreshing, refresh } = useRefresh(async () => {
		await mineViewRef.current?.refresh();
	});

	useScrollToTop(scrollViewRef);

	return (
		<RNScreensSafeAreaView
			edges={{
				bottom: true,
			}}
			style={{
				flex: 1,
			}}
		>
			<ScrollView
				ref={scrollViewRef}
				refreshControl={
					uid ? (
						<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
					) : undefined
				}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					flexGrow: 1,
				}}
			>
				<Header
					title={uid ? t("tabs.mine.title") : ""}
					headerTransparent
					headerRight={() => {
						return (
							<View className="mr-4 overflow-hidden rounded-full bg-secondary">
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={t("settings.title")}
									className="items-center justify-center"
									style={{
										height: 48,
										aspectRatio: 1,
									}}
									onPress={() => {
										navigation.navigate(ScreenName.Settings);
									}}
								>
									<MaterialDesignIcons name="cog" size={24} />
								</Pressable>
							</View>
						);
					}}
				/>
				{uid ? <MineResolver ref={mineViewRef} uid={uid} /> : <SignInPrompt />}
			</ScrollView>
		</RNScreensSafeAreaView>
	);
};

export default Screen;
