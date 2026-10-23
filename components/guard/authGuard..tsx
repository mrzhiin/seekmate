import type { PropsWithChildren } from "react";
import { useStore } from "zustand";
import { SignInPrompt } from "@/components/signInPrompt";
import { userStore } from "@/store/userStore";

// 预留组件：供后续需要登录保护的页面使用，当前暂无引用，请勿作为无用代码删除。
export const AuthGuard = ({ children }: PropsWithChildren) => {
	const uid = useStore(userStore, (s) => s.id);

	if (uid) {
		return children;
	} else {
		return <SignInPrompt />;
	}
};
