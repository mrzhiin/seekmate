import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToastAndroid, View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { Text } from "@/components/ui/text";
import { useAttendanceQuery } from "@/hooks/services/useAttendanceQuery";
import { config } from "@/lib/config";
import {
	type AttendanceWebViewMessage,
	createAttendanceScript,
} from "@/state/web/attendance";
import { CheckInType } from "@/store/appStore";
import { Pressable } from "../pressable";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";

export const Attendance = () => {
	const webViewRef = useRef<WebView>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isWebview, setIsWebview] = useState(false);
	const { t } = useTranslation();
	const { data, refetch, isLoading, isFetching } = useAttendanceQuery();
	const signedInData = data ?? null;
	const hasSignedIn = signedInData !== null;
	const isInitialLoading = data === undefined && (isLoading || isFetching);

	const handleMessage = async (event: WebViewMessageEvent) => {
		try {
			const message: AttendanceWebViewMessage = JSON.parse(
				event.nativeEvent.data,
			);

			if (message.success) {
				await refetch();
				ToastAndroid.show(t("mine.attendance.success"), ToastAndroid.SHORT);
			} else {
				ToastAndroid.show(t("mine.attendance.failed"), ToastAndroid.SHORT);
			}
		} catch (_) {
			ToastAndroid.show(t("mine.attendance.error"), ToastAndroid.SHORT);
		} finally {
			setIsSubmitting(false);
			setIsWebview(false);

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		}
	};

	const handleLoad = () => {
		webViewRef.current?.injectJavaScript(
			createAttendanceScript(CheckInType.Fixed),
		);
	};

	const trigger = () => {
		if (isSubmitting || isLoading || isFetching || hasSignedIn) return;
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			setIsSubmitting(false);
			setIsWebview(false);
			timeoutRef.current = null;
		}, 5000);

		setIsWebview(true);
		setIsSubmitting(true);
	};

	return (
		<Pressable
			className="rounded-xl bg-muted flex-1 p-4"
			onPress={trigger}
			disabled={isSubmitting || isInitialLoading || hasSignedIn}
		>
			<View className="gap-2 items-center">
				{signedInData ? (
					<>
						<View
							className="grow items-center justify-center"
							style={{
								height: 24,
							}}
						>
							<MaterialDesignIcons
								size={24}
								name="check-circle-outline"
								className="text-green-500"
							/>
						</View>
						<Text className="text-base">
							{t("mine.attendance.signedIn", { coins: signedInData.coins })}
						</Text>
					</>
				) : isSubmitting ? (
					<>
						<View
							className="grow items-center justify-center"
							style={{
								height: 24,
							}}
						>
							<MaterialDesignIcons
								size={24}
								name="progress-clock"
								className="text-secondary-foreground"
							/>
						</View>
						<Text className="text-base">{t("mine.attendance.signingIn")}</Text>
					</>
				) : isInitialLoading ? (
					<>
						<View
							className="grow items-center justify-center"
							style={{
								height: 24,
							}}
						>
							<MaterialDesignIcons
								size={24}
								name="progress-clock"
								className="text-secondary-foreground"
							/>
						</View>
						<Text className="text-base">{t("mine.attendance.loading")}</Text>
					</>
				) : (
					<>
						<View
							className="grow items-center justify-center"
							style={{
								height: 24,
							}}
						>
							<MaterialDesignIcons
								size={24}
								name="alert-circle-outline"
								className="text-secondary-foreground"
							/>
						</View>
						<Text className="text-base">
							{t("mine.attendance.notSignedIn")}
						</Text>
					</>
				)}
			</View>
			{isWebview && (
				<WebView
					style={{
						display: "none",
					}}
					ref={webViewRef}
					source={{
						uri: new URL("board", config.siteUrl).toString(),
					}}
					onLoad={handleLoad}
					onMessage={handleMessage}
				/>
			)}
		</Pressable>
	);
};
