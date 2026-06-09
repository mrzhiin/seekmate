import { LegendList } from "@legendapp/list/react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Pressable } from "@/components/pressable";
import { Text } from "@/components/ui/text";
import { formatViewedAt, getViewedPosts } from "@/lib/storage";
import { ScreenName } from "@/stack/screenName";
import type { ScreenParams } from "@/stack/screenParams";

export const RecentViewedPosts = () => {
	const navigation = useNavigation<NativeStackNavigationProp<ScreenParams>>();
	const { t } = useTranslation();
	const [recentViewedPosts, setRecentViewedPosts] = useState(getViewedPosts);

	useFocusEffect(
		useCallback(() => {
			setRecentViewedPosts(getViewedPosts());
		}, []),
	);

	if (!recentViewedPosts?.length) {
		return null;
	}

	return (
		<View className="mt-4 gap-3">
			<View className="flex-row items-center justify-between px-1">
				<Text className="text-base">{t("mine.recentViewedPosts.title")}</Text>
			</View>
			<LegendList
				style={{
					marginHorizontal: -16,
				}}
				contentContainerStyle={{
					paddingHorizontal: 20,
				}}
				data={recentViewedPosts}
				horizontal
				recycleItems
				renderItem={({ item: post }) => {
					return (
						<Pressable
							className="w-72 rounded-xl border border-border bg-card p-4"
							onPress={() => {
								navigation.navigate(ScreenName.Post, {
									id: post.id,
								});
							}}
						>
							<View className="gap-3">
								<View className="flex-row items-center gap-2">
									<View className="rounded-full bg-muted px-2.5 py-1">
										<Text className="text-xs text-muted-foreground">
											{formatViewedAt(post.viewedAt)}
										</Text>
									</View>
								</View>
								<Text className="text-base" numberOfLines={1}>
									{post.title}
								</Text>
								<Text
									className="text-sm text-muted-foreground"
									numberOfLines={1}
								>
									{post.excerpt}
								</Text>
							</View>
						</Pressable>
					);
				}}
				keyExtractor={(post) => post.id.toString()}
				ItemSeparatorComponent={() => {
					return <View style={{ width: 12 }} />;
				}}
				estimatedItemSize={288}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	);
};
