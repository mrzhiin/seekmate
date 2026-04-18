import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { type Ref, useContext, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ToastAndroid, View } from "react-native";
import { useStore } from "zustand";
import { Text } from "@/components/ui/text";
import { useRashUserQuery } from "@/hooks/services/useUserQuery";
import { config } from "@/lib/config";
import { WebServiceContext } from "@/state/web";
import { userStore } from "@/store/userStore";
import { UserItem } from "../post/userItem";
import { Pressable } from "../pressable";
import { TrueSheetMenu } from "../trueSheet";

const createBanScript = (payload: Record<string, unknown>) => {
	const url = new URL(`/api/block-list/add`, config.apiBaseUrl).toString();

	return `
const data = ${JSON.stringify(payload)};
const res = await fetch(
	"${url}",
	{
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
		},
	},
);

return await res.json()
`;
};

export const AvatarMenu = ({
	uid,
	ref,
}: {
	uid?: number;
	ref?: Ref<TrueSheetMenu>;
}) => {
	const user = useRashUserQuery(uid || 0, Boolean(uid));
	const { t } = useTranslation();
	const webServiceContext = useContext(WebServiceContext);
	const isBlockingRef = useRef(false);
	const userId = useStore(userStore, (s) => s.id);

	return (
		<TrueSheetMenu
			ref={ref}
			menus={[
				userId && userId !== uid
					? {
							key: "ban",
							icon: "cancel" as const,
							label: t("avatar.menu.blockUser"),
							onPress: async () => {
								if (user.data?.name && !isBlockingRef.current) {
									isBlockingRef.current = true;
									webServiceContext
										.run(
											createBanScript({
												block_member_name: user.data.name,
											}),
										)
										?.then((res) => {
											if (res?.success) {
												ToastAndroid.show(
													t("avatar.block.success"),
													ToastAndroid.SHORT,
												);
											} else {
												ToastAndroid.show(
													t("avatar.block.failed"),
													ToastAndroid.SHORT,
												);
											}
										})
										.catch((_) => {
											ToastAndroid.show(
												t("avatar.block.failed"),
												ToastAndroid.SHORT,
											);
										})
										.finally(() => {
											isBlockingRef.current = false;
										});
								} else {
									ToastAndroid.show(
										t("avatar.block.failed"),
										ToastAndroid.SHORT,
									);
								}
							},
						}
					: null,
				{
					key: "open",
					icon: "open-in-new" as const,
					label: t("post.menu.openInBrowser"),
					onPress: async () => {
						if (!uid) {
							return;
						}

						const url = new URL(`space/${uid}`, config.siteUrl);
						Linking.openURL(url.toString());
					},
				},
			].filter((x) => x !== null)}
		>
			{uid ? <UserItem uid={uid} /> : null}
		</TrueSheetMenu>
	);
};

export const Avatar = ({
	uid,
	size = 32,
	showRank = false,
	enableMenu = true,
	onPress,
}: {
	uid?: number;
	size?: number;
	showRank?: boolean;
	enableMenu?: boolean;
	onPress?: () => void;
}) => {
	const avatarHref = useMemo(() => {
		return uid
			? new URL(`avatar/${uid}.png`, config.apiBaseUrl).toString()
			: null;
	}, [uid]);
	const trueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const user = useRashUserQuery(uid || 0, Boolean(uid && showRank));

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
					onPress?.();

					if (enableMenu && !onPress) {
						trueSheetMenuRef.current?.present();
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
				{typeof user.data?.rank === "number" && showRank && (
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
			{enableMenu && <AvatarMenu ref={trueSheetMenuRef} uid={uid} />}
		</>
	);
};
