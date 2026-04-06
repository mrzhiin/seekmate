import type { PropsWithChildren } from "react";
import { useStore } from "zustand";
import { userStore } from "@/store/userStore";
import { SignInPrompt } from "../signInPrompt";

export const AuthGuard = ({ children }: PropsWithChildren) => {
	const uid = useStore(userStore, (s) => s.id);

	if (uid) {
		return children;
	} else {
		return <SignInPrompt />;
	}
};
