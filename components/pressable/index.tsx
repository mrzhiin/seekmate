import { Platform } from "react-native";
import {
	type PressableProps,
	Pressable as RNGPressable,
} from "react-native-gesture-handler";
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
		<RNGPressable
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
		</RNGPressable>
	);
};
