import { Image } from "expo-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ToastAndroid } from "react-native";
import { Item } from "./Item";

export const ClearImageCache = () => {
	const [isClearing, setIsClearing] = useState(false);
	const { t } = useTranslation();

	const clearImageCache = async () => {
		if (isClearing) {
			return;
		}

		setIsClearing(true);

		try {
			const [memoryResult, diskResult] = await Promise.allSettled([
				Image.clearMemoryCache(),
				Image.clearDiskCache(),
			]);

			const isMemoryCacheCleared =
				memoryResult.status === "fulfilled" && memoryResult.value;
			const isDiskCacheCleared =
				diskResult.status === "fulfilled" && diskResult.value;

			if (isMemoryCacheCleared && isDiskCacheCleared) {
				ToastAndroid.show(
					t("settings.clearImageCache.success"),
					ToastAndroid.SHORT,
				);
				return;
			} else {
				ToastAndroid.show(
					t("settings.clearImageCache.partial"),
					ToastAndroid.SHORT,
				);
			}
		} catch {
			ToastAndroid.show(
				t("settings.clearImageCache.failed"),
				ToastAndroid.SHORT,
			);
		} finally {
			setIsClearing(false);
		}
	};

	const handlePressClearImageCache = () => {
		if (isClearing) {
			return;
		}

		Alert.alert(
			t("settings.clearImageCache.title"),
			t("settings.clearImageCache.message"),
			[
				{
					text: t("common.cancel"),
					style: "cancel",
				},
				{
					text: t("common.confirm"),
					style: "destructive",
					onPress: clearImageCache,
				},
			],
		);
	};

	return (
		<Item
			label={t("settings.clearImageCache.label")}
			subLabel={t("settings.clearImageCache.description")}
			onPress={handlePressClearImageCache}
		/>
	);
};
