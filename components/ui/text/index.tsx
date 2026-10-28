import { Text as RNText, type TextProps } from "react-native";
import { twMerge } from "tailwind-merge";

export const TextStyleFontFamily = "app";
export const TextClassName = "text-sm font-medium text-foreground";

export const Text = ({ style, children, className, ...props }: TextProps) => {
	return (
		<RNText
			{...props}
			style={[style]}
			className={twMerge(TextClassName, className)}
		>
			{children}
		</RNText>
	);
};
