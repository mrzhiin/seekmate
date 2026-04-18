import PQueue from "p-queue";
import {
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import type {
	WebViewErrorEvent,
	WebViewHttpErrorEvent,
} from "react-native-webview/lib/WebViewTypes";
import { config } from "@/lib/config";

const RUN_TIMEOUT_MS = 15_000;

export interface Message {
	id: string;
	success: boolean;
	data?: unknown;
	error?: string;
}

interface PendingEvent {
	id: string;
	resolve: (v: Message) => void;
	reject: (v: Message) => void;
	timeoutId: ReturnType<typeof setTimeout>;
}

export interface WebRunnerRef {
	run?: (e: string) => Promise<Message>;
}

const createScript = (id: string, script: string) => {
	return `
(() => {
	const main = async () => {
		${script}
	};

	main()
		.then((e) => {
			window.ReactNativeWebView.postMessage(
				JSON.stringify({
				    id: ${JSON.stringify(id)},
					success: true,
					data: e,
				}),
			);
		})
		.catch((error) => {
			window.ReactNativeWebView.postMessage(
				JSON.stringify({
                    id: ${JSON.stringify(id)},
					success: false,
					error: error instanceof Error ? error.message : String(error),
				}),
			);
		});
})();
`;
};

export const WebRunner = ({ ref }: { ref?: Ref<WebRunnerRef> }) => {
	const [isWebview, setIsWebview] = useState(false);
	const webViewRef = useRef<WebView>(null);
	const queueRef = useRef(
		new PQueue({
			autoStart: false,
		}),
	);
	const eventMapRef = useRef(new Map<string, PendingEvent>());
	const countRef = useRef(0);

	const clearPendingEvent = useCallback((id: string) => {
		const pendingEvent = eventMapRef.current.get(id);

		if (!pendingEvent) {
			return undefined;
		}

		clearTimeout(pendingEvent.timeoutId);
		eventMapRef.current.delete(id);
		return pendingEvent;
	}, []);

	const rejectAllPending = useCallback((error: string) => {
		eventMapRef.current.forEach(({ id, reject, timeoutId }) => {
			clearTimeout(timeoutId);
			reject({
				id,
				success: false,
				error,
			});
		});
		eventMapRef.current.clear();
	}, []);

	const handleLoad = () => {
		queueRef.current.start();
	};

	const handleError = (_event: WebViewErrorEvent) => {
		rejectAllPending("webview load failed");
	};

	const handleHttpError = (_event: WebViewHttpErrorEvent) => {
		rejectAllPending("webview request failed");
	};

	const handleMessage = (event: WebViewMessageEvent) => {
		let message: Message;

		try {
			message = JSON.parse(event.nativeEvent.data) as Message;
		} catch {
			return;
		}

		const pendingEvent = clearPendingEvent(message.id);

		if (pendingEvent) {
			if (message.success) {
				pendingEvent.resolve(message);
			} else {
				pendingEvent.reject(message);
			}
		}
	};

	useImperativeHandle(ref, () => {
		return {
			run: async (e: string) => {
				if (!e) {
					return Promise.reject({
						id: "0",
						success: false,
						error: new Error("script is required").message,
					});
				}

				const id = `event:${++countRef.current}`;

				return queueRef.current.add(
					async () => {
						if (!webViewRef.current) {
							return Promise.reject({
								id,
								success: false,
								error: "webview is not ready",
							});
						}

						let _resolve: (value: Message) => void = () => {};
						let _reject: (value: Message) => void = () => {};

						const promise = new Promise<Message>((res, rej) => {
							_resolve = res;
							_reject = rej;
						});

						const timeoutId = setTimeout(() => {
							const pendingEvent = clearPendingEvent(id);

							if (!pendingEvent) {
								return;
							}

							pendingEvent.reject({
								id,
								success: false,
								error: `script execution timed out after ${RUN_TIMEOUT_MS}ms`,
							});
						}, RUN_TIMEOUT_MS);

						const event = {
							id,
							resolve: _resolve,
							reject: _reject,
							timeoutId,
						};

						eventMapRef.current.set(id, event);
						webViewRef.current?.injectJavaScript(createScript(id, e));
						return promise;
					},
					{
						id,
					},
				);
			},
		};
	}, [clearPendingEvent]);

	useEffect(() => {
		const queue = queueRef.current;
		const handleAdd = () => {
			setIsWebview(true);
		};

		const handleIdle = () => {
			setIsWebview(false);
			queue.pause();
		};

		queue.on("add", handleAdd);
		queue.on("idle", handleIdle);

		return () => {
			queue.off("add", handleAdd);
			queue.off("idle", handleIdle);
		};
	}, []);

	useEffect(() => {
		return () => {
			rejectAllPending("web runner unmounted");
		};
	}, [rejectAllPending]);

	if (!isWebview) {
		return null;
	}

	return (
		<View
			style={{
				display: "none",
				position: "absolute",
				width: 1,
				height: 1,
			}}
		>
			<WebView
				ref={webViewRef}
				source={{
					uri: new URL("board", config.siteUrl).toString(),
				}}
				onLoad={handleLoad}
				onError={handleError}
				onHttpError={handleHttpError}
				onMessage={handleMessage}
			/>
		</View>
	);
};
