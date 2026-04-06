import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useMemo } from "react";
import { config } from "@/lib/config";
import { Pressable } from "../pressable";

export const Avatar = ({
	uid,
	size = 32,
	jump = false,
}: {
	uid?: number;
	size?: number;
	jump?: boolean;
}) => {
	const avatarHref = useMemo(() => {
		return uid
			? new URL(`avatar/${uid}.png`, config.apiBaseUrl).toString()
			: null;
	}, [uid]);

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
		</Pressable>
	);
};
