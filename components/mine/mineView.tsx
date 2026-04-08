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
import { View } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { useStore } from "zustand";
import { Avatar } from "@/components/avatar";
import { Attendance } from "@/components/mine/attendance";
import { Notification } from "@/components/mine/notification";
import { Rank } from "@/components/mine/rank";
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
			<View className="items-center gap-4">
				<Avatar size={128} uid={data.uid} />
				<View className="gap-1 items-center">
					<Text className="text-2xl">{data.name}</Text>
					<View className="flex-row items-center">
						<View className="flex-1 flex-row gap-1.5 items-center justify-end">
							<MaterialDesignIcons name="food-drumstick" size={14} />
							<Text>{data.coinCount}</Text>
						</View>
						<MaterialDesignIcons name="circle-small" size={24} />
						<View className="flex-1">
							<Text>{`Lv.${data.rank}`}</Text>
						</View>
					</View>
				</View>
				<View className="flex-row">
					{[
						{
							key: "postCount",
							label: "主题帖数",
							value: data.postCount,
							onPress: () => {
								goWebview("#/discussions");
							},
						},
						{
							key: "commentCount",
							label: "评论数目",
							value: data.commentCount,
							onPress: () => {
								goWebview("#/comments");
							},
						},
						{
							key: "favoriteCount",
							label: "收藏项数",
							value: data.favoriteCount,
							onPress: () => {
								goWebview("#/collections");
							},
						},
					].map((x, idx, arr) => {
						return (
							<View key={x.key} className="flex-1">
								<Pressable onPress={x.onPress}>
									<View
										className={`items-center gap-1 ${idx === arr.length - 1 ? "" : "border-r border-border"}`}
									>
										<Text className="text-sm">{x.value || "-"}</Text>
										<Text className="text-sm text-muted-foreground">
											{x.label}
										</Text>
									</View>
								</Pressable>
							</View>
						);
					})}
				</View>
			</View>
			<View className="mt-4 mx-4 gap-2">
				<Rank user={data} />
				<View className="flex-row gap-2">
					<Attendance />
					<Notification />
				</View>
			</View>
		</MineRefreshContext.Provider>
	);
};

export const useMineRefreshContext = () => useContext(MineRefreshContext);
