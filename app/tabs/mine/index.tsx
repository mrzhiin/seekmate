import { Header } from "@react-navigation/elements";
import { useNavigation, useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView } from "react-native-gesture-handler";
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
	const scrollViewRef = useRef<ScrollView>(null);

	const { isRefreshing, refresh } = useRefresh(async () => {
		await mineViewRef.current?.refresh();
	});

	useScrollToTop(scrollViewRef);

	return (
		<RNScreensSafeAreaView
			edges={{
				bottom: true,
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
					flex: 1,
				}}
			>
				<Header
					title={uid ? t("tabs.mine.title") : ""}
					headerTransparent
					headerRight={() => {
						return (
							<Pressable
								className="mr-2 rounded-full justify-center items-center"
								style={{
									height: 40,
									aspectRatio: 1,
								}}
								onPress={() => {
									navigation.navigate(ScreenName.Settings);
								}}
							>
								<MaterialDesignIcons name="cog" size={24} />
							</Pressable>
						);
					}}
				/>
				{uid ? <MineResolver ref={mineViewRef} uid={uid} /> : <SignInPrompt />}
			</ScrollView>
		</RNScreensSafeAreaView>
	);
};

export default Screen;
