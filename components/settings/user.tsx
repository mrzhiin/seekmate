import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useStore } from "zustand";
import { ScreenName } from "@/stack/screenName";
import { userStore } from "@/store/userStore";
import { Avatar } from "../avatar";
import { Item } from "./Item";

export const User = () => {
	const userId = useStore(userStore, (s) => s.id);
	const navigation = useNavigation();
	const { t } = useTranslation();

	if (userId) {
		return (
			<Item
				label={t("settings.user.logout")}
				subLabel={t("settings.user.logoutDescription")}
				right={<Avatar uid={userId} size={48} />}
				onPress={() => {
					Alert.alert(t("settings.user.confirmLogout"), "", [
						{
							text: t("common.cancel"),
							style: "cancel",
						},
						{
							text: t("common.confirm"),
							style: "destructive",
							onPress: () => {
								userStore.getState().reset();
							},
						},
					]);
				}}
			/>
		);
	}

	return (
		<Item
			label={t("settings.user.signIn")}
			subLabel={t("settings.user.signInDescription")}
			onPress={() => {
				navigation.navigate(ScreenName.Authenticate);
			}}
		/>
	);
};
