import type { NavigationBarStyle } from "expo-navigation-bar";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar, type StatusBarStyle } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo } from "react";
import { useCSSVariable, useUniwind } from "uniwind";

export const ThemeProvider = (props: React.PropsWithChildren) => {
	const { theme } = useUniwind();
	const backgroundColor = useCSSVariable("--color-background");

	const statusBarStyle = useMemo<StatusBarStyle>(() => {
		switch (theme) {
			case "dark":
				return "light";

			case "light":
				return "dark";
			default:
				return "auto";
		}
	}, [theme]);

	const navigationBarStyle = useMemo<NavigationBarStyle>(() => {
		switch (theme) {
			case "dark":
				return "dark";

			case "light":
				return "light";
			default:
				return "auto";
		}
	}, [theme]);

	useEffect(() => {
		NavigationBar.setStyle(navigationBarStyle);
	}, [navigationBarStyle]);

	useEffect(() => {
		if (typeof backgroundColor === "string") {
			SystemUI.setBackgroundColorAsync(backgroundColor);
		}
	}, [backgroundColor]);

	return (
		<>
			<StatusBar animated style={statusBarStyle} />
			{props.children}
		</>
	);
};
