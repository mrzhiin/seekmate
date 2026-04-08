import { useNavigation, useScrollToTop } from "@react-navigation/native";
import { useRef } from "react";
import { View } from "react-native";
import { RefreshControl, ScrollView } from "react-native-gesture-handler";
import { CategoryIcons } from "@/components/icon/CategoryIcon";
import { Pressable } from "@/components/pressable";
import { Text } from "@/components/ui/text";
import { useCategoriesSuspenseQuery } from "@/hooks/services/useCategoriesQuery";
import { useRefresh } from "@/hooks/useRefresh";
import { ScreenName } from "@/stack/screenName";

export const CategoriesView = () => {
	const navigation = useNavigation();
	const scrollViewRef = useRef<ScrollView>(null);
	const { data, refetch } = useCategoriesSuspenseQuery();
	const { isRefreshing, refresh } = useRefresh(refetch);

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
							>
								<Text className="text-secondary-foreground">{x.nameZh}</Text>
								<CategoryIcons slug={x.slug} size={28} />
							</Pressable>
						</View>
					);
				})}
			</View>
			{/* <View className="px-4 mt-12 gap-4">
					<Text className="text-base">推荐</Text>
					<Advertise />
				</View> */}
		</ScrollView>
	);
};
