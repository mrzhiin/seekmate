import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { ErrorFallback } from "@/components/errorFallback";
import { Spinner } from "@/components/spinner";
import type { ScreenName } from "@/stack/screenName";
import type { ScreenParams } from "@/stack/screenParams";

export type Params =
	| {
			uri?: string;
	  }
	| undefined;

type Props = NativeStackScreenProps<ScreenParams, typeof ScreenName.WebView>;

const Screen = ({ route }: Props) => {
	const sourceUri = route.params?.uri;
	const navigation = useNavigation();
	const webViewRef = useRef<null | WebView>(null);
	const isAllowBackRef = useRef(false);

	const [title, setTitle] = useState("");
	const [canGoBack, setCanGoBack] = useState(false);
	const [canGoForward, setCanGoForward] = useState(false);
	const [loading, setLoading] = useState(false);
	const [url, setUrl] = useState("");

	useEffect(() => {
		navigation.setOptions({
			headerTitle: () => {
				if (!loading) {
					return "";
				}

				return (
					<ActivityIndicator
						color="#1E88E5"
						size={24}
						style={{
							alignSelf: "flex-start",
						}}
					/>
				);
			},
		});
	}, [navigation, loading]);

	useEffect(() => {
		const handle: Parameters<typeof navigation.addListener<"beforeRemove">>[1] =
			(e) => {
				if (
					canGoBack &&
					webViewRef.current?.goBack &&
					!isAllowBackRef.current
				) {
					e.preventDefault();
					webViewRef.current?.goBack();
				} else {
					navigation.dispatch(e.data.action);
				}
			};

		navigation.addListener("beforeRemove", handle);
		return () => {
			navigation.removeListener("beforeRemove", handle);
		};
	}, [navigation, canGoBack]);

	if (!sourceUri) {
		return <ErrorFallback />;
	}

	return (
		<WebView
			ref={webViewRef}
			style={{ flex: 1 }}
			source={{
				uri: sourceUri,
			}}
			onNavigationStateChange={(e) => {
				if (e.canGoBack !== canGoBack) {
					setCanGoBack(e.canGoBack);
				}

				if (e.url !== url) {
					setUrl(e.url);
				}

				if (e.canGoForward !== canGoForward) {
					setCanGoForward(e.canGoForward);
				}

				if (e.title !== title) {
					setTitle(e.title);
				}

				if (e.loading !== loading) {
					setLoading(e.loading);
				}
			}}
			renderLoading={() => {
				return <Spinner />;
			}}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			startInLoadingState
		/>
	);
};

export default Screen;
