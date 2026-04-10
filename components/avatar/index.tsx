import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useMemo } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useRashUserQuery } from "@/hooks/services/useUserQuery";
import { config } from "@/lib/config";
import { Pressable } from "../pressable";

export const Avatar = ({
	uid,
	size = 32,
	jump = false,
	showRank = false,
}: {
	uid?: number;
	size?: number;
	jump?: boolean;
	showRank?: boolean;
}) => {
	const avatarHref = useMemo(() => {
		return uid
			? new URL(`avatar/${uid}.png`, config.apiBaseUrl).toString()
			: null;
	}, [uid]);

	const user = useRashUserQuery(uid || 0, Boolean(uid && showRank));

	if (!avatarHref) {
		return null;
	}

	return (
		<Pressable
			className="border-border border-2 bg-muted"
			style={{
				width: size,
				height: size,
				borderRadius: size,
				padding: 1,
				position: "relative",
			}}
			onPress={() => {
				if (jump) {
					const url = new URL(`space/${uid}`, config.siteUrl);
					Linking.openURL(url.toString());
				}
			}}
		>
			<Image
				source={avatarHref}
				style={{
					flex: 1,
					borderRadius: size,
				}}
			/>
			{typeof user.data?.rank === "number" && (
				<View
					style={{
						position: "absolute",
						bottom: 0,
						right: 0,
						height: 12,
						aspectRatio: 1,
					}}
					className="bg-primary-foreground rounded-full justify-center items-center border border-border"
				>
					<Text
						className="text-primary font-semibold"
						style={{
							fontSize: 8,
							lineHeight: 8,
						}}
					>
						{user.data.rank}
					</Text>
				</View>
			)}
		</Pressable>
	);
};
