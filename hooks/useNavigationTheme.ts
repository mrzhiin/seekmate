import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";
import { useMemo } from "react";
import { useUniwind } from "uniwind";
import { useCSSVariableString } from "./useStyle";

export const useNavigationTheme = () => {
	const { theme } = useUniwind();

	const primaryColor = useCSSVariableString("--color-primary");
	const backgroundColor = useCSSVariableString("--color-background");
	const foregroundColor = useCSSVariableString("--color-foreground");
	const borderColor = useCSSVariableString("--color-border");

	const navigationTheme = useMemo((): Theme => {
		const isDark = theme === "dark";
		const _t = isDark ? DarkTheme : DefaultTheme;

		return {
			dark: isDark,
			colors: {
				primary: primaryColor || _t.colors.primary,
				background: backgroundColor || _t.colors.background,
				card: backgroundColor || _t.colors.card,
				text: foregroundColor || _t.colors.text,
				border: borderColor || _t.colors.border,
				notification: _t.colors.notification,
			},
			fonts: _t.fonts,
		};
	}, [primaryColor, backgroundColor, foregroundColor, borderColor, theme]);

	return navigationTheme;
};
