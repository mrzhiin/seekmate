import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useRashUserQuery } from "@/hooks/services/useUserQuery";
import { config } from "@/lib/config";
import { UserItem } from "../post/userItem";
import { Pressable } from "../pressable";
import { TrueSheetMenu } from "../trueSheet";

export const Avatar = ({
	uid,
	size = 32,
	showRank = false,
}: {
	uid?: number;
	size?: number;
	showRank?: boolean;
}) => {
	const avatarHref = useMemo(() => {
		return uid
			? new URL(`avatar/${uid}.png`, config.apiBaseUrl).toString()
			: null;
	}, [uid]);
	const trueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const user = useRashUserQuery(uid || 0, Boolean(uid && showRank));
	const { t } = useTranslation();

	if (!avatarHref) {
		return null;
	}

	return (
		<>
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
					trueSheetMenuRef.current?.present();
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
			<TrueSheetMenu
				ref={trueSheetMenuRef}
				menus={[
					{
						key: "open",
						icon: "open-in-new",
						label: t("post.menu.openInBrowser"),
						onPress: () => {
							const url = new URL(`space/${uid}`, config.siteUrl);
							Linking.openURL(url.toString());
						},
					},
				]}
			>
				{uid ? <UserItem uid={uid} /> : null}
			</TrueSheetMenu>
		</>
	);
};
