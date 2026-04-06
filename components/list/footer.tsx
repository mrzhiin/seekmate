import { View } from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";
import { Spinner } from "../spinner";
import { Text } from "../ui/text";

export const ListFooter = ({
	isFetchingNextPage,
	hasNextPage,
	isFetching,
}: {
	isFetchingNextPage: boolean;
	hasNextPage: boolean;
	isFetching: boolean;
}) => {
	if (isFetchingNextPage) {
		return (
			<SafeAreaView edges={{ bottom: true }}>
				<View className="py-3 items-center justify-center">
					<Spinner />
				</View>
			</SafeAreaView>
		);
	} else if (hasNextPage) {
		return (
			<SafeAreaView edges={{ bottom: true }}>
				<View className="py-3 items-center justify-center">
					<Text className="text-muted-foreground font-normal">
						上拉加载更多
					</Text>
				</View>
			</SafeAreaView>
		);
	} else if (!isFetching) {
		return (
			<SafeAreaView edges={{ bottom: true }}>
				<View className="py-3 items-center justify-center">
					<Text className="text-muted-foreground font-normal">已全部加载</Text>
				</View>
			</SafeAreaView>
		);
	} else if (isFetching) {
		return (
			<SafeAreaView edges={{ bottom: true }}>
				<View className="py-3 items-center justify-center">
					<Spinner />
				</View>
			</SafeAreaView>
		);
	}
};
