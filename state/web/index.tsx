import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useRef,
} from "react";
import { useStore } from "zustand";
import { userStore } from "@/store/userStore";
import { AutoCheckIn } from "./autoCheckIn";
import { type Message, WebRunner, type WebRunnerRef } from "./runner";

export const WebServiceContext = createContext<{
	run: (script: string) => Promise<Message>;
}>({
	run: () => Promise.reject(new Error("Web service is not available")),
});

export const WebServiceProvider = (props: PropsWithChildren) => {
	const { children } = props;
	const webRunnerRef = useRef<WebRunnerRef>(null);
	const userKey = useStore(userStore, (s) => {
		return `user:${s.id}`;
	});

	const run = useCallback((script: string) => {
		if (userStore.getState().id == null) {
			return Promise.reject(new Error("Sign in before performing this action"));
		}
		return (
			webRunnerRef.current?.run?.(script) ??
			Promise.reject(new Error("Web runner is not available"))
		);
	}, []);

	return (
		<WebServiceContext value={{ run }}>
			{children}
			<AutoCheckIn />
			<WebRunner ref={webRunnerRef} key={userKey} />
		</WebServiceContext>
	);
};
