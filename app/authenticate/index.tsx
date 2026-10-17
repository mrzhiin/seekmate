import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Keyboard, View } from "react-native";
import WebView, {
	type WebViewMessageEvent,
	type WebViewNavigation,
} from "react-native-webview";
import * as v from "valibot";
import { Spinner } from "@/components/spinner";
import { Text } from "@/components/ui/text";
import { signInUserSession } from "@/lib/auth/session";
import { config } from "@/lib/config";
import { ScreenName } from "@/stack/screenName";
import type { ScreenParams } from "@/stack/screenParams";

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
	const webViewRef = useRef<WebView<unknown>>(null);
	const { t } = useTranslation();
	const [isSigningIn, setIsSigningIn] = useState(false);
	const prevUrlPathnameRef = useRef<string>(null);
	const signInControllerRef = useRef<AbortController | null>(null);

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

	useEffect(() => () => signInControllerRef.current?.abort(), []);

	useEffect(() => {
		navigation.setOptions({
			title: t("auth.title"),
		});
	}, [navigation, t]);

	const completeSignIn = async (userId: number) => {
		if (signInControllerRef.current) return;

		const controller = new AbortController();

		signInControllerRef.current = controller;
		Keyboard.dismiss();
		setIsSigningIn(true);

		try {
			await signInUserSession(userId, controller.signal);
			if (!controller.signal.aborted) {
				navigation.popTo(ScreenName.Tabs);
			}
		} catch {
			if (!controller.signal.aborted) {
				Alert.alert(t("auth.title"), t("auth.userDataFailed"), [
					{ text: t("common.cancel"), style: "cancel" },
					{
						text: t("common.retry"),
						onPress: () => {
							void completeSignIn(userId);
						},
					},
				]);
			}
		} finally {
			signInControllerRef.current = null;
			if (!controller.signal.aborted) {
				setIsSigningIn(false);
			}
		}
	};

	const handleMessage = (event: WebViewMessageEvent) => {
		const result = v.safeParse(
			MessageSuccessStringSchema,
			event.nativeEvent.data,
		);

		if (result.success) {
			completeSignIn(result.output.data.userId);
		}
	};

	return (
		<View className="flex-1">
			<View
				className="flex-1"
				pointerEvents={isSigningIn ? "none" : "auto"}
				importantForAccessibility={isSigningIn ? "no-hide-descendants" : "auto"}
			>
				<WebView<unknown>
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
			{isSigningIn && (
				<View
					className="absolute inset-0 items-center justify-center gap-4 bg-background/80 px-6"
					accessible
					accessibilityRole="progressbar"
					accessibilityLabel={t("auth.signingIn")}
					accessibilityState={{ busy: true }}
					accessibilityLiveRegion="polite"
				>
					<Spinner />
					<Text className="text-base text-center">{t("auth.signingIn")}</Text>
				</View>
			)}
		</View>
	);
};

export default Screen;
