import type { Params as PostsScreenParams } from "@/app/posts";
import type { Params as PostScreenParams } from "@/app/posts/[id]";
import type { Params as UserScreenParams } from "@/app/user/[id]";
import type { Params as WebViewScreenParams } from "@/app/webView";
import { ScreenName } from "./screenName";

type SpecificScreenParams = {
	[ScreenName.WebView]: WebViewScreenParams;
	[ScreenName.Post]: PostScreenParams;
	[ScreenName.Posts]: PostsScreenParams;
	[ScreenName.User]: UserScreenParams;
};

export type ScreenParams = {
	[K in (typeof ScreenName)[keyof typeof ScreenName]]: K extends keyof SpecificScreenParams
		? SpecificScreenParams[K]
		: undefined;
};
