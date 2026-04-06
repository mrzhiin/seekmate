import { Header } from "@react-navigation/elements";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo } from "react";
import { SafeAreaView as RNScreensSafeAreaView } from "react-native-screens/experimental";
import { PostList } from "@/components/post/postList";
import { Pressable } from "@/components/pressable";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { ScreenName } from "@/stack/screenName";

const Tab = createMaterialTopTabNavigator();

const Screen = () => {
	const navigation = useNavigation();

	const PostsSortByReplyTime = useMemo(() => {
		return () => <PostList sortBy="replyTime" />;
	}, []);

	useEffect(() => {
		navigation.setOptions({
			headerShown: false,
		});
	}, [navigation]);

	return (
		<RNScreensSafeAreaView
			edges={{
				bottom: true,
			}}
		>
			<Header
				title="SeekMate"
				headerShadowVisible={false}
				headerRight={() => {
					return (
						<Pressable
							className="mr-2 rounded-full justify-center items-center"
							style={{
								height: 40,
								aspectRatio: 1,
							}}
							onPress={() => {
								navigation.navigate(ScreenName.Search);
							}}
						>
							<MaterialDesignIcons name="magnify" size={24} />
						</Pressable>
					);
				}}
			/>
			<Tab.Navigator
				style={{
					flex: 1,
				}}
				screenOptions={{
					tabBarLabelStyle: {
						fontSize: 16,
					},
					lazy: true,
				}}
			>
				<Tab.Screen name="新帖子" component={PostList} />
				<Tab.Screen name="新评论" component={PostsSortByReplyTime} />
			</Tab.Navigator>
		</RNScreensSafeAreaView>
	);
};

export default Screen;
