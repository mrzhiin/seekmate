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
import * as v from "valibot";
import { config } from "@/lib/config";

const RUN_TIMEOUT_MS = 15_000;

const MessageStringSchema = v.pipe(
	v.string(),
	v.parseJson(),
	v.object({
		id: v.string(),
		success: v.boolean(),
		data: v.optional(v.unknown()),
		error: v.optional(v.string()),
		code: v.optional(v.literal("TIMEOUT")),
	}),
);

export type Message = v.InferOutput<typeof MessageStringSchema>;

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
	const webViewRef = useRef<WebView<unknown>>(null);
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
		queueRef.current.pause();
		queueRef.current.clear();
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
		setIsWebview(false);
	};

	const handleHttpError = (_event: WebViewHttpErrorEvent) => {
		rejectAllPending("webview request failed");
		setIsWebview(false);
	};

	const handleMessage = (event: WebViewMessageEvent) => {
		const result = v.safeParse(MessageStringSchema, event.nativeEvent.data);

		if (!result.success) {
			return;
		}

		const message = result.output;
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
				const controller = new AbortController();
				const timeoutError: Message = {
					id,
					success: false,
					error: `web operation timed out after ${RUN_TIMEOUT_MS}ms`,
					code: "TIMEOUT",
				};
				// Include page loading and queueing, not just injected script execution.
				const timeoutId = setTimeout(() => {
					clearPendingEvent(id)?.reject(timeoutError);
					controller.abort();
				}, RUN_TIMEOUT_MS);

				const task = queueRef.current.add(
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
						signal: controller.signal,
					},
				);

				return task
					.catch((error: unknown) => {
						// React Native's AbortController does not preserve abort reasons.
						if (controller.signal.aborted) throw timeoutError;
						throw error instanceof Error
							? { id, success: false, error: error.message }
							: error;
					})
					.finally(() => {
						clearTimeout(timeoutId);
						clearPendingEvent(id);
					});
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

		queue.addEventListener("add", handleAdd);
		queue.addEventListener("idle", handleIdle);

		return () => {
			queue.removeEventListener("add", handleAdd);
			queue.removeEventListener("idle", handleIdle);
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
			<WebView<unknown>
				ref={webViewRef}
				source={{
					uri: new URL("board", config.siteUrl).toString(),
				}}
				onLoad={handleLoad}
				onError={handleError}
				onHttpError={handleHttpError}
				onMessage={handleMessage}
				webviewDebuggingEnabled={false}
			/>
		</View>
	);
};
