import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useNotificationQuery } from "@/hooks/services/useNotificationQuery";
import { config } from "@/lib/config";
import { ScreenName } from "@/stack/screenName";
import { Pressable } from "../pressable";

export const Notification = () => {
	const navigation = useNavigation();
	const { data } = useNotificationQuery();

	return (
		<Pressable
			className="rounded-xl bg-muted flex-1 p-4"
			onPress={() => {
				navigation.navigate(ScreenName.WebView, {
					uri: new URL("notification", config.apiBaseUrl).toString(),
				});
			}}
		>
			<View className="gap-2 items-center">
				<View className="grow items-center justify-center">
					<Text className="text-xl">{data?.unreadCount ?? "-"}</Text>
				</View>
				<Text className="text-base">未读数</Text>
			</View>
		</Pressable>
	);
};
