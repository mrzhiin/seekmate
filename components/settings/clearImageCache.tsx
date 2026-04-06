import { Image } from "expo-image";
import { useState } from "react";
import { Alert, ToastAndroid } from "react-native";
import { Item } from "./Item";

export const ClearImageCache = () => {
	const [isClearing, setIsClearing] = useState(false);

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
				ToastAndroid.show("图片缓存已清理", ToastAndroid.SHORT);
				return;
			} else {
				ToastAndroid.show("部分图片缓存未能清理", ToastAndroid.SHORT);
			}
		} catch {
			ToastAndroid.show("图片缓存清理失败", ToastAndroid.SHORT);
		} finally {
			setIsClearing(false);
		}
	};

	const handlePressClearImageCache = () => {
		if (isClearing) {
			return;
		}

		Alert.alert("清理图片缓存", "确认清理当前设备上的图片缓存吗？", [
			{
				text: "取消",
				style: "cancel",
			},
			{
				text: "确认",
				style: "destructive",
				onPress: clearImageCache,
			},
		]);
	};

	return (
		<Item
			label="清理图片缓存"
			subLabel="删除已缓存图片资源，释放空间"
			onPress={handlePressClearImageCache}
		/>
	);
};
