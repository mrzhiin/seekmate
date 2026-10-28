import { type ComponentRef, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";
import { useStore } from "zustand";
import { Pressable } from "@/components/pressable";
import { TrueSheet } from "@/components/trueSheet";
import { Text } from "@/components/ui/text";
import { userDataStore } from "@/store/userDataStore";
import { userStore } from "@/store/userStore";
import { Item } from "./Item";

export const NodeImageApiKey = () => {
	const userId = useStore(userStore, (s) => s.id);
	const apiKey = useStore(userDataStore, (s) => s.nodeImageApiKey);
	const update = useStore(userDataStore, (s) => s.update);
	const trueSheetRef = useRef<ComponentRef<typeof TrueSheet>>(null);
	const [draftApiKey, setDraftApiKey] = useState("");
	const { t } = useTranslation();

	if (!userId) return null;

	return (
		<>
			<Item
				icon="key-outline"
				label={t("settings.nodeImageApiKey.label")}
				subLabel={t(
					apiKey
						? "settings.nodeImageApiKey.configured"
						: "settings.nodeImageApiKey.description",
				)}
				onPress={() => {
					setDraftApiKey(apiKey);
					trueSheetRef.current?.present();
				}}
			/>
			<TrueSheet ref={trueSheetRef} detents={["auto"]}>
				<View className="px-6 pt-8 pb-6 gap-4">
					<TextInput
						value={draftApiKey}
						onChangeText={setDraftApiKey}
						accessibilityLabel={t("settings.nodeImageApiKey.label")}
						placeholder="X-API-Key"
						autoCapitalize="none"
						autoCorrect={false}
						secureTextEntry
						className="min-h-12 rounded-xl bg-secondary px-4 text-base text-foreground"
					/>
					<Pressable
						accessibilityRole="button"
						className="min-h-12 items-center justify-center rounded-full bg-primary px-8"
						onPress={() => {
							update({ nodeImageApiKey: draftApiKey.trim() });
							trueSheetRef.current?.dismiss();
						}}
					>
						<Text className="text-base text-primary-foreground">
							{t("common.confirm")}
						</Text>
					</Pressable>
				</View>
			</TrueSheet>
		</>
	);
};
