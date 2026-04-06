import { NavigationContainer } from "@react-navigation/native";
import { useNavigationTheme } from "@/hooks/useNavigationTheme";

export const NavigationProvider = (props: React.PropsWithChildren) => {
	const navigationTheme = useNavigationTheme();

	return (
		<NavigationContainer theme={navigationTheme}>
			{props.children}
		</NavigationContainer>
	);
};
