import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useMineRefreshContext } from "@/components/mine/mineView";
import { Text } from "@/components/ui/text";
import { useNotificationQuery } from "@/hooks/services/useNotificationQuery";
import { config } from "@/lib/config";
import { ScreenName } from "@/stack/screenName";
import { Pressable } from "../pressable";

export const Notification = () => {
	const { registerRefresh, unregisterRefresh } = useMineRefreshContext();
	const navigation = useNavigation();
	const { data, refetch } = useNotificationQuery();
	const { t } = useTranslation();

	useEffect(() => {
		const refresh = () => refetch();

		registerRefresh(refresh);

		return () => {
			unregisterRefresh(refresh);
		};
	}, [refetch, registerRefresh, unregisterRefresh]);

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
				<Text className="text-base">{t("mine.notification.unreadCount")}</Text>
			</View>
		</Pressable>
	);
};
