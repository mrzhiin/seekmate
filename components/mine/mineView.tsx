import { useNavigation } from "@react-navigation/native";
import {
	createContext,
	type Ref,
	useCallback,
	useContext,
	useImperativeHandle,
	useMemo,
	useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useStore } from "zustand";
import { Avatar } from "@/components/avatar";
import { Attendance } from "@/components/mine/attendance";
import { Notification } from "@/components/mine/notification";
import { Rank } from "@/components/mine/rank";
import { RecentViewedPosts } from "@/components/mine/recentViewedPosts";
import { Pressable } from "@/components/pressable";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { Text } from "@/components/ui/text";
import { useUserSuspenseQuery } from "@/hooks/services/useUserQuery";
import { config } from "@/lib/config";
import { ScreenName } from "@/stack/screenName";
import { userStore } from "@/store/userStore";

type MineRefreshContextValue = {
	registerRefresh: (refresh: () => Promise<unknown> | unknown) => void;
	unregisterRefresh: (refresh: () => Promise<unknown> | unknown) => void;
};

export const MineRefreshContext = createContext<MineRefreshContextValue>({
	registerRefresh: () => {},
	unregisterRefresh: () => {},
});

export type MineViewRef = {
	refresh: () => Promise<void>;
};

export const MineView = ({
	uid,
	ref,
}: {
	uid: number;
	ref?: Ref<MineViewRef>;
}) => {
	const { data, refetch } = useUserSuspenseQuery(uid);
	const navigation = useNavigation();
	const { t } = useTranslation();
	const userId = useStore(userStore, (s) => s.id);
	const refreshSetRef = useRef(new Set<() => Promise<unknown> | unknown>());

	const goWebview = (hash: string) => {
		const url = new URL(`space/${userId}`, config.siteUrl);
		url.hash = hash;

		navigation.navigate(ScreenName.WebView, {
			uri: url.toString(),
		});
	};

	const registerRefresh = useCallback(
		(refresh: () => Promise<unknown> | unknown) => {
			refreshSetRef.current.add(refresh);
		},
		[],
	);

	const unregisterRefresh = useCallback(
		(refresh: () => Promise<unknown> | unknown) => {
			refreshSetRef.current.delete(refresh);
		},
		[],
	);

	const refresh = useCallback(async () => {
		await Promise.allSettled([
			refetch(),
			...Array.from(refreshSetRef.current, (runRefresh) => runRefresh()),
		]);
	}, [refetch]);

	useImperativeHandle(
		ref,
		() => ({
			refresh,
		}),
		[refresh],
	);

	const contextValue = useMemo(
		() => ({
			registerRefresh,
			unregisterRefresh,
		}),
		[registerRefresh, unregisterRefresh],
	);

	return (
		<MineRefreshContext.Provider value={contextValue}>
			<View className="items-center gap-4 px-4 pt-2">
				<Avatar size={128} uid={data.uid} showRank={false} />
				<View className="items-center gap-2">
					<Text className="text-2xl font-semibold text-center">
						{data.name}
					</Text>
					<View className="flex-row items-center gap-2 rounded-full bg-muted px-3 py-1">
						<MaterialDesignIcons
							name="food-drumstick"
							size={14}
							className="text-muted-foreground"
						/>
						<Text className="text-sm text-muted-foreground">
							{data.coinCount}
						</Text>
						<View className="h-3 w-px bg-border" />
						<Text className="text-sm text-muted-foreground">
							{t("mine.profile.level", { level: data.rank })}
						</Text>
					</View>
				</View>
				<View className="flex-row self-stretch overflow-hidden rounded-xl">
					{[
						{
							key: "postCount",
							label: t("mine.profile.postCount"),
							value: data.postCount,
							onPress: () => {
								goWebview("#/discussions");
							},
						},
						{
							key: "commentCount",
							label: t("mine.profile.commentCount"),
							value: data.commentCount,
							onPress: () => {
								goWebview("#/comments");
							},
						},
						{
							key: "favoriteCount",
							label: t("mine.profile.favoriteCount"),
							value: data.favoriteCount,
							onPress: () => {
								goWebview("#/collections");
							},
						},
					].map((x) => {
						return (
							<Pressable
								key={x.key}
								className="flex-1 items-center gap-1 px-2 py-3"
								accessibilityRole="button"
								accessibilityLabel={`${x.label}: ${x.value ?? "-"}`}
								onPress={x.onPress}
							>
								<Text className="text-base font-semibold">
									{x.value ?? "-"}
								</Text>
								<Text className="text-sm text-muted-foreground">{x.label}</Text>
							</Pressable>
						);
					})}
				</View>
			</View>
			<View className="mx-4 mt-4 gap-2 pb-4">
				<Rank user={data} />
				<View className="flex-row gap-2">
					<Attendance />
					<Notification />
				</View>
				<RecentViewedPosts />
			</View>
		</MineRefreshContext.Provider>
	);
};

export const useMineRefreshContext = () => useContext(MineRefreshContext);
