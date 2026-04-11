import * as Linking from "expo-linking";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useRashUserQuery } from "@/hooks/services/useUserQuery";
import { config } from "@/lib/config";
import { Avatar } from "../avatar";
import { Pressable } from "../pressable";

export const UserItem = ({ uid }: { uid: number }) => {
	const { data } = useRashUserQuery(uid);

	return (
		<Pressable
			className="flex-row items-center gap-4 px-6 py-2 justify-between"
			onPress={() => {
				const url = new URL(`space/${uid}`, config.siteUrl);
				Linking.openURL(url.toString());
			}}
		>
			<View>
				<Text className="text-lg">{data?.name || "/"}</Text>
				<Text className="text-sm text-secondary-foreground">
					Lv.{data?.rank || "-"}
				</Text>
			</View>
			<Avatar uid={uid} size={48} />
		</Pressable>
	);
};
