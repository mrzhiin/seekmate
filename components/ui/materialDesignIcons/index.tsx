import RNMaterialDesignIcons, {
	type MaterialDesignIconsIconName,
} from "@react-native-vector-icons/material-design-icons";
import type { ColorValue, StyleProp, TextStyle } from "react-native";
import { useResolveClassNames } from "uniwind";

export const MaterialDesignIcons = ({
	name,
	size,
	color,
	style,
	className = "text-foreground",
}: {
	name: MaterialDesignIconsIconName;
	size?: number;
	color?: ColorValue;
	style?: StyleProp<TextStyle>;
	className?: string;
}) => {
	const styles = useResolveClassNames(className);

	return (
		<RNMaterialDesignIcons
			name={name}
			size={size}
			style={[styles, style]}
			color={color ?? styles.color}
		/>
	);
};
