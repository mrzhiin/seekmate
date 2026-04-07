import { LinearGradient } from "expo-linear-gradient";
import {
	type Ref,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, ToastAndroid, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { useCSSVariableString } from "@/hooks/useStyle";
import { config } from "@/lib/config";
import { Pressable } from "../pressable";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";

interface CommentWebViewMessage {
	requestId: string;
	success: boolean;
	status?: number;
	resData?: unknown;
	error?: string;
}

interface PendingSubmission {
	requestId: string;
	content: string;
	hasInjected: boolean;
}

function generateRandomString(length: number) {
	let result = "";
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charsLength = chars.length;
	let index = 0;
	while (index < length) {
		result += chars.charAt(Math.floor(Math.random() * charsLength));
		index += 1;
	}
	return result;
}

const createPostCommentScript = (
	payload: Record<string, unknown>,
	requestId: string,
) => {
	const url = new URL("api/content/new-comment", config.apiBaseUrl).toString();
	const t = generateRandomString(16);

	return `
(() => {
	const main = async () => {
		const data = ${JSON.stringify(payload)};
		const res = await fetch(
			"${url}",
			{
				method: "POST",
				body: JSON.stringify(data),
				headers: {
                    "Content-Type": "application/json",
                    "csrf-token": "${t}"
                },
			},
		);

		let body = null;
		try {
			body = await res.json();
		} catch (_) {
			body = null;
		}

		if (!res.ok) {
			throw new Error(
				JSON.stringify({
					status: res.status,
					body,
				}),
			);
		}

		return {
			status: res.status,
			body,
		};
	};

	main()
		.then((e) => {
			window.ReactNativeWebView.postMessage(
				JSON.stringify({
					requestId: "${requestId}",
					success: true,
					status: e.status,
					resData: e.body,
				}),
			);
		})
		.catch((e) => {
			let error = String(e);
			let status = undefined;
			let resData = undefined;

			try {
				const parsed = JSON.parse(e.message);
				status = parsed.status;
				resData = parsed.body;
			} catch (_) {}

			window.ReactNativeWebView.postMessage(
				JSON.stringify({
					requestId: "${requestId}",
					success: false,
					status,
					resData,
					error,
				}),
			);
		});
})();
`;
};

export type InputBar = {
	appendText: (text: string) => void;
};

export const InputBar = ({
	postId,
	onPost,
	ref,
}: {
	postId: number;
	onPost?: () => void | Promise<void>;
	ref?: Ref<InputBar>;
}) => {
	const boxShadowColor = useCSSVariableString("--color-border");
	const linearColor = useCSSVariableString("--color-background");
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [text, setText] = useState("");
	const [isWebview, setIsWebview] = useState(false);
	const inputRef = useRef<TextInput>(null);
	const insets = useSafeAreaInsets();
	const webViewRef = useRef<WebView>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingSubmissionRef = useRef<PendingSubmission | null>(null);

	useImperativeHandle(ref, () => {
		return {
			appendText: (text: string) => {
				setText((p) => `${p.length ? `${p} ` : ""}${text}`);
			},
		};
	}, []);

	const clearPendingTimeout = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	};

	const resetSubmission = () => {
		pendingSubmissionRef.current = null;
		clearPendingTimeout();
		setIsLoading(false);
		setIsWebview(false);
	};

	const createComment = () => {
		const content = text.trim();
		if (isLoading || !content) return;

		const requestId = generateRandomString(16);
		pendingSubmissionRef.current = {
			requestId,
			content,
			hasInjected: false,
		};
		setIsLoading(true);
		setIsWebview(true);
		clearPendingTimeout();
		timeoutRef.current = setTimeout(() => {
			if (pendingSubmissionRef.current?.requestId !== requestId) return;
			resetSubmission();
			ToastAndroid.show(t("post.inputBar.timeout"), ToastAndroid.SHORT);
		}, 5000);
	};

	const handleLoad = () => {
		const pendingSubmission = pendingSubmissionRef.current;
		if (
			isLoading &&
			isWebview &&
			pendingSubmission &&
			!pendingSubmission.hasInjected
		) {
			pendingSubmission.hasInjected = true;
			const payload = {
				content: pendingSubmission.content,
				mode: "new-comment",
				postId,
			};
			webViewRef.current?.injectJavaScript(
				createPostCommentScript(payload, pendingSubmission.requestId),
			);
		}
	};

	const handleMessage = (event: WebViewMessageEvent) => {
		if (!isLoading || !isWebview) return;

		let shouldResetSubmission = false;

		try {
			const message: CommentWebViewMessage = JSON.parse(event.nativeEvent.data);
			const pendingSubmission = pendingSubmissionRef.current;

			if (
				!pendingSubmission ||
				message.requestId !== pendingSubmission.requestId
			) {
				return;
			}

			shouldResetSubmission = true;

			if (message.success) {
				setText("");
				onPost?.();
				ToastAndroid.show(t("post.inputBar.success"), ToastAndroid.SHORT);
			} else {
				ToastAndroid.show(t("post.inputBar.failed"), ToastAndroid.SHORT);
			}
		} catch (_) {
			ToastAndroid.show(t("post.inputBar.failed"), ToastAndroid.SHORT);
		} finally {
			if (shouldResetSubmission) {
				resetSubmission();
			}
		}
	};

	useEffect(() => {
		return () => {
			pendingSubmissionRef.current = null;
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, []);

	return (
		<View
			style={{
				paddingBottom: insets.bottom,
			}}
		>
			<LinearGradient
				colors={["transparent", linearColor ?? "transparent"]}
				start={{ x: 0.5, y: 0 }}
				end={{ x: 0.5, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>
			<View
				className="bg-secondary flex-row items-end rounded-4xl border-4 border-background mx-4 mb-4"
				style={{
					boxShadow: [
						{
							offsetX: 0,
							offsetY: 0,
							blurRadius: 4,
							color: boxShadowColor,
						},
					],
				}}
			>
				<TextInput
					ref={inputRef}
					value={text}
					onChangeText={(e) => {
						setText(e);
					}}
					multiline
					numberOfLines={4}
					autoFocus={false}
					placeholder={t("post.inputBar.placeholder")}
					className="font-sans text-base text-foreground flex-1 pl-2"
					readOnly={isLoading}
				/>
				<View className="flex-row items-center p-2 rounded-full">
					<Pressable
						className="rounded-full justify-center items-center bg-primary"
						style={{
							height: 32,
							aspectRatio: 1,
						}}
						onPress={createComment}
						disabled={isLoading}
					>
						{isLoading ? (
							<MaterialDesignIcons
								name="progress-helper"
								size={24}
								className="text-secondary"
							/>
						) : (
							<MaterialDesignIcons
								name="arrow-up"
								size={24}
								className="text-primary-foreground"
							/>
						)}
					</Pressable>
				</View>
			</View>
			{isWebview ? (
				<View
					accessible={false}
					pointerEvents="none"
					style={{
						position: "absolute",
						display: "none",
					}}
				>
					<WebView
						ref={webViewRef}
						source={{
							uri: new URL(`post-${postId}-1`, config.siteUrl).toString(),
						}}
						onLoad={handleLoad}
						onMessage={handleMessage}
					/>
				</View>
			) : null}
		</View>
	);
};
