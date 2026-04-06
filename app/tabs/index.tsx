import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { ScreenName } from "@/stack/screenName";
import ScreenCategories from "./categories";
import ScreenHome from "./home";
import ScreenMine from "./mine";

const [HomeIconSource, CategoriesIconSource, MineIconSource] = [
	MaterialDesignIcons.getImageSourceSync("post-outline", 48),
	MaterialDesignIcons.getImageSourceSync("shape-outline", 48),
	MaterialDesignIcons.getImageSourceSync("account-circle-outline", 48),
];

const Tab = createNativeBottomTabNavigator();

const Screen = () => {
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			headerShown: false,
		});
	}, [navigation]);

	return (
		<Tab.Navigator>
			<Tab.Screen
				name={ScreenName.Home}
				component={ScreenHome}
				options={{
					tabBarLabel: "首页",
					tabBarIcon: () => {
						return {
							type: "image",
							source: {
								uri: HomeIconSource?.uri,
							},
						};
					},
				}}
			/>
			<Tab.Screen
				name={ScreenName.Categories}
				component={ScreenCategories}
				options={{
					tabBarLabel: "版块",
					tabBarIcon: () => {
						return {
							type: "image",
							source: {
								uri: CategoriesIconSource?.uri,
							},
						};
					},
				}}
			/>
			<Tab.Screen
				name={ScreenName.Mine}
				component={ScreenMine}
				options={{
					tabBarLabel: "我的",
					tabBarIcon: () => {
						return {
							type: "image",
							source: {
								uri: MineIconSource?.uri,
							},
						};
					},
				}}
			/>
		</Tab.Navigator>
	);
};

export default Screen;
