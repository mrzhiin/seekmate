import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { View } from "react-native";
import { useAdvertiseQuery } from "@/hooks/services/useAdvertiseQuery";
import { config } from "@/lib/config";
import { Pressable } from "../pressable";

export const Advertise = () => {
	const { data } = useAdvertiseQuery();

	if (!data?.length) return;

	return (
		<View className="flex-row flex-wrap -m-1">
			{data.map((x) => {
				return (
					<Pressable
						key={x.order}
						className="p-2  rounded-xl"
						style={{
							width: "50%",
						}}
						onPress={() => {
							Linking.openURL(x.target);
						}}
					>
						<View
							className="bg-muted rounded-xl overflow-hidden border border-border"
							style={{
								aspectRatio: 260 / 80,
							}}
						>
							<Image
								source={{
									uri: x.img,
									headers: {
										referer: config.siteUrl,
									},
								}}
								contentFit="cover"
								className="flex-1"
								style={{
									height: "100%",
									width: "100%",
								}}
							/>
						</View>
					</Pressable>
				);
			})}
		</View>
	);
};
