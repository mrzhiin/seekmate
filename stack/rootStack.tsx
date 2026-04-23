import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { type RootScreenName, ScreenOrder, Screens } from "./screen";
import { ScreenName } from "./screenName";
import type { ScreenParams } from "./screenParams";

declare global {
	namespace ReactNavigation {
		interface RootParamList extends ScreenParams {}
	}
}

const Stack = createNativeStackNavigator<ScreenParams>();

const renderScreen = <Name extends RootScreenName>(name: Name) => (
	<Stack.Screen
		key={name}
		name={name}
		component={Screens[name].component}
		options={{
			title: Screens[name].title,
		}}
	/>
);

export const RootStack = () => {
	return (
		<Stack.Navigator
			initialRouteName={ScreenName.Tabs}
			screenOptions={{
				headerShadowVisible: false,
			}}
		>
			{ScreenOrder.map(renderScreen)}
		</Stack.Navigator>
	);
};
