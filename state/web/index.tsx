import { createContext, type PropsWithChildren, useRef } from "react";
import { useStore } from "zustand";
import { userStore } from "@/store/userStore";
import { AutoCheckIn } from "./autoCheckIn";
import { type Message, WebRunner, type WebRunnerRef } from "./runner";

export const WebServiceContext = createContext<{
	run: (script: string) => undefined | Promise<Message>;
}>({
	run: () => {},
});

export const WebServiceProvider = (props: PropsWithChildren) => {
	const { children } = props;
	const webRunnerRef = useRef<WebRunnerRef>(null);
	const userKey = useStore(userStore, (s) => {
		return `user:${s.id}`;
	});

	return (
		<WebServiceContext
			value={{
				run: (e) => {
					return webRunnerRef.current?.run?.(e);
				},
			}}
		>
			{children}
			<AutoCheckIn />
			<WebRunner ref={webRunnerRef} key={userKey} />
		</WebServiceContext>
	);
};
