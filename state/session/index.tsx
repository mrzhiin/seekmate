import { type PropsWithChildren, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { handleUserSessionChange } from "@/lib/auth/session";
import { userStore } from "@/store/userStore";

export const SessionProvider = ({ children }: PropsWithChildren) => {
	const userId = useStore(userStore, (s) => s.id);
	const isReadyRef = useRef(false);
	const prevUserIdRef = useRef<number | undefined>(userId);

	useEffect(() => {
		if (!isReadyRef.current) {
			isReadyRef.current = true;
			prevUserIdRef.current = userId;
			return;
		}

		handleUserSessionChange({
			prevUserId: prevUserIdRef.current,
			nextUserId: userId,
		});

		prevUserIdRef.current = userId;
	}, [userId]);

	return children;
};
