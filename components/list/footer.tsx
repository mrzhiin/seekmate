import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";
import { Spinner } from "../spinner";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
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
	const { t } = useTranslation();
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
						{t("list.footer.loadingMore")}
					</Text>
				</View>
			</SafeAreaView>
		);
	} else if (!isFetching) {
		return (
			<SafeAreaView edges={{ bottom: true }}>
				<View className="flex-row items-center justify-center gap-2 py-5">
					<MaterialDesignIcons
						name="check-circle-outline"
						size={14}
						className="text-muted-foreground"
					/>
					<Text className="text-xs text-muted-foreground font-normal">
						{t("list.footer.allLoaded")}
					</Text>
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
