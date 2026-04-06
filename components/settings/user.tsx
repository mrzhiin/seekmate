import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
import { useStore } from "zustand";
import { ScreenName } from "@/stack/screenName";
import { userStore } from "@/store/userStore";
import { Avatar } from "../avatar";
import { Item } from "./Item";

export const User = () => {
	const userId = useStore(userStore, (s) => s.id);
	const navigation = useNavigation();

	if (userId) {
		return (
			<Item
				label="登出"
				subLabel="退出当前账户"
				right={<Avatar uid={userId} size={48} />}
				onPress={() => {
					Alert.alert("确认退出?", "", [
						{
							text: "取消",
							style: "cancel",
						},
						{
							text: "确认",
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
			label="登入"
			subLabel="Lets get started"
			onPress={() => {
				navigation.navigate(ScreenName.Authenticate);
			}}
		/>
	);
};
