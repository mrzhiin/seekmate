import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { useStore } from "zustand";
import { getAttendanceQueryOptions } from "@/hooks/services/useAttendanceQuery";
import { config } from "@/lib/config";
import { queryClient } from "@/state/query";
import { appStore } from "@/store/appStore";
import { userStore } from "@/store/userStore";
import {
	type AttendanceWebViewMessage,
	createAttendanceScript,
} from "./attendance";

export const AutoCheckIn = () => {
	const userId = useStore(userStore, (s) => s.id);
	const autoCheckIn = useStore(appStore, (s) => s.autoCheckIn);
	const checkInType = useStore(appStore, (s) => s.checkInType);
	const webViewRef = useRef<WebView>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const attemptedUsersRef = useRef(new Set<number>());
	const pendingUserIdRef = useRef<number | null>(null);
	const [isWebViewVisible, setIsWebViewVisible] = useState(false);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!autoCheckIn || !userId || attemptedUsersRef.current.has(userId)) {
			return;
		}

		attemptedUsersRef.current.add(userId);

		let cancelled = false;

		const tryAutoCheckIn = async () => {
			try {
				const attendance = await queryClient.fetchQuery(
					getAttendanceQueryOptions(userId),
				);

				if (cancelled || attendance) {
					return;
				}

				pendingUserIdRef.current = userId;
				setIsWebViewVisible(true);

				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				timeoutRef.current = setTimeout(() => {
					setIsWebViewVisible(false);
					pendingUserIdRef.current = null;
					timeoutRef.current = null;
				}, 5000);
			} catch (_) {}
		};

		tryAutoCheckIn();
		return () => {
			cancelled = true;
		};
	}, [autoCheckIn, userId]);

	const handleLoad = () => {
		webViewRef.current?.injectJavaScript(createAttendanceScript(checkInType));
	};

	const handleMessage = async (event: WebViewMessageEvent) => {
		const currentUserId = pendingUserIdRef.current;

		try {
			const message: AttendanceWebViewMessage = JSON.parse(
				event.nativeEvent.data,
			);

			if (message.success && currentUserId) {
				await queryClient.fetchQuery(getAttendanceQueryOptions(currentUserId));
			}
		} finally {
			setIsWebViewVisible(false);
			pendingUserIdRef.current = null;

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		}
	};

	if (!isWebViewVisible) {
		return null;
	}

	return (
		<View
			pointerEvents="none"
			accessible={false}
			style={{
				position: "absolute",
				width: 1,
				height: 1,
				opacity: 0,
				left: -9999,
				top: 0,
			}}
		>
			<WebView
				accessible={false}
				ref={webViewRef}
				source={{
					uri: new URL("board", config.siteUrl).toString(),
				}}
				onLoad={handleLoad}
				onMessage={handleMessage}
			/>
		</View>
	);
};
