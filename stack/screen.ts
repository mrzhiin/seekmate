import AuthenticateScreen from "@/app/authenticate";
import PostsScreen from "@/app/posts";
import PostScreen from "@/app/posts/[id]";
import SearchScreen from "@/app/search";
import SettingsScreen from "@/app/settings";
import SigninScreen from "@/app/singin";
import TabsScreen from "@/app/tabs";
import WebviewScreen from "@/app/webView";
import { ScreenName } from "./screenName";

export const Screens = [
	{
		name: ScreenName.Tabs,
		title: undefined,
		component: TabsScreen,
	},
	{
		name: ScreenName.Settings,
		component: SettingsScreen,
	},
	{
		name: ScreenName.Post,
		component: PostScreen,
	},
	{
		name: ScreenName.Posts,
		component: PostsScreen,
	},
	{
		name: ScreenName.WebView,
		component: WebviewScreen,
	},
	{
		name: ScreenName.Signin,
		component: SigninScreen,
	},
	{
		name: ScreenName.Authenticate,
		component: AuthenticateScreen,
	},
	{
		name: ScreenName.Search,
		component: SearchScreen,
	},
];
