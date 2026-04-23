import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ComponentType } from "react";
import AuthenticateScreen from "@/app/authenticate";
import CategoriesSortScreen from "@/app/categoriesSort";
import PostsScreen from "@/app/posts";
import PostScreen from "@/app/posts/[id]";
import SearchScreen from "@/app/search";
import SettingsScreen from "@/app/settings";
import SigninScreen from "@/app/singin";
import TabsScreen from "@/app/tabs";
import WebviewScreen from "@/app/webView";
import { ScreenName } from "./screenName";
import type { ScreenParams } from "./screenParams";

type ScreenComponent<Name extends keyof ScreenParams> = ComponentType<
	NativeStackScreenProps<ScreenParams, Name>
>;

type Entry<Name extends keyof ScreenParams> = {
	title?: string;
	component: ScreenComponent<Name>;
};

const screen = <Name extends keyof ScreenParams>(
	component: ScreenComponent<Name>,
	title?: string,
): Entry<Name> => ({
	title,
	component,
});

export const ScreenOrder = [
	ScreenName.Tabs,
	ScreenName.Settings,
	ScreenName.Post,
	ScreenName.Posts,
	ScreenName.WebView,
	ScreenName.Signin,
	ScreenName.Authenticate,
	ScreenName.Search,
	ScreenName.CategoriesSort,
] as const;

export type RootScreenName = (typeof ScreenOrder)[number];

const screens = <Names extends RootScreenName>(
	value: {
		[Name in Names]: Entry<Name>;
	},
) => value;

export const Screens: { [Name in RootScreenName]: Entry<Name> } = screens({
	[ScreenName.Tabs]: screen(TabsScreen),
	[ScreenName.Settings]: screen(SettingsScreen),
	[ScreenName.Post]: screen(PostScreen),
	[ScreenName.Posts]: screen(PostsScreen),
	[ScreenName.WebView]: screen(WebviewScreen),
	[ScreenName.Signin]: screen(SigninScreen),
	[ScreenName.Authenticate]: screen(AuthenticateScreen),
	[ScreenName.Search]: screen(SearchScreen),
	[ScreenName.CategoriesSort]: screen(CategoriesSortScreen),
});
