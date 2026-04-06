import { Text as RNText, type TextProps } from "react-native";

export const TextStyleFontFamily = "app";
export const TextClassName = "text-sans text-sm font-medium text-foreground";

export const Text = ({ style, children, className, ...props }: TextProps) => {
	return (
		<RNText
			{...props}
			style={[style]}
			className={`${TextClassName} ${className || ""}`}
		>
			{children}
		</RNText>
	);
};
