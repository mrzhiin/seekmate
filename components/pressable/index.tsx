import {
	Platform,
	type PressableProps,
	Pressable as RNPressable,
} from "react-native";
import { useResolveClassNames } from "uniwind";

export const AndroidRipple = {
	color: "rgba(0, 0, 0, 0.1)",
};

export const Pressable = ({
	children,
	style,
	android_ripple,
	className,
	...props
}: PressableProps) => {
	const styles = useResolveClassNames(className || "");

	return (
		<RNPressable
			android_ripple={{
				...AndroidRipple,
				...android_ripple,
			}}
			style={({ pressed }) => [
				{
					opacity: Platform.OS === "ios" && pressed ? 0.7 : 1,
				},
				typeof style === "function" ? style({ pressed }) : style,
				styles,
			]}
			{...props}
		>
			{children}
		</RNPressable>
	);
};
