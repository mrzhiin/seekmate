import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Screens } from "./screen";
import { ScreenName } from "./screenName";
import type { ScreenParams } from "./screenParams";

declare global {
	namespace ReactNavigation {
		interface RootParamList extends ScreenParams {}
	}
}

const Stack = createNativeStackNavigator<ScreenParams>();

export const RootStack = () => {
	return (
		<Stack.Navigator
			initialRouteName={ScreenName.Tabs}
			screenOptions={{
				headerShadowVisible: false,
			}}
		>
			{Screens.map((x) => {
				return (
					<Stack.Screen
						key={x.name}
						name={x.name}
						component={x.component}
						options={{
							title: x.title,
						}}
					/>
				);
			})}
		</Stack.Navigator>
	);
};
