import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import WebView, {
	type WebViewMessageEvent,
	type WebViewNavigation,
} from "react-native-webview";
import * as v from "valibot";
import { useStore } from "zustand";
import { config } from "@/lib/config";
import { ScreenName } from "@/stack/screenName";
import type { ScreenParams } from "@/stack/screenParams";
import { userStore } from "@/store/userStore";

const MessageSuccessSchema = v.object({
	success: v.literal(true),
	data: v.object({
		userId: v.number(),
	}),
});

const MessageSuccessStringSchema = v.pipe(
	v.string(),
	v.parseJson(),
	MessageSuccessSchema,
);

const SIGNIN_URL = new URL("/signIn.html", config.apiBaseUrl).toString();

const runJS = `
const UsernameEl = document.querySelector(".Username");
if (UsernameEl) {
	const spaceHref = UsernameEl.getAttribute("href");
	if (typeof spaceHref === "string" && spaceHref.length > 0) {
		const idString = spaceHref.split("/").pop();
		const id = Number(idString);
		if (Number.isNaN(id)) {
			window.ReactNativeWebView.postMessage(
				JSON.stringify({
					success: false,
					message: "Invalid user id",
				}),
			);
		} else {
			window.ReactNativeWebView.postMessage(
				JSON.stringify({
					success: true,
					data: {
						userId: id,
					},
				}),
			);
		}
	}
}
`;

const Screen = () => {
	const navigation = useNavigation<NativeStackNavigationProp<ScreenParams>>();
	const webViewRef = useRef<WebView>(null);
	const update = useStore(userStore, (s) => s.update);
	const { t } = useTranslation();

	const prevUrlPathnameRef = useRef<string>(null);

	useEffect(() => {
		navigation.setOptions({
			title: t("auth.title"),
		});
	}, [navigation, t]);

	const handleNavigationStateChange = useCallback(
		(navState: WebViewNavigation) => {
			if (navState.loading || navState.url === SIGNIN_URL) return;

			const url = new URL(navState.url);

			if (prevUrlPathnameRef.current !== url.pathname) {
				webViewRef.current?.injectJavaScript(runJS);
			}

			prevUrlPathnameRef.current = url.pathname;
		},
		[],
	);

	const handleMessage = (event: WebViewMessageEvent) => {
		const result = v.safeParse(
			MessageSuccessStringSchema,
			event.nativeEvent.data,
		);

		if (result.success) {
			update({
				id: result.output.data.userId,
			});

			navigation.popTo(ScreenName.Tabs);
		}
	};

	return (
		<View className="flex-1">
			<WebView
				ref={webViewRef}
				className="flex-1"
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				source={{
					uri: SIGNIN_URL,
				}}
				onNavigationStateChange={handleNavigationStateChange}
				onMessage={handleMessage}
				webviewDebuggingEnabled={false}
			/>
		</View>
	);
};

export default Screen;
