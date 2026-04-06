import { ActivityIndicator } from "react-native";
import { useCSSVariableString } from "@/hooks/useStyle";

export const Spinner = () => {
	const color = useCSSVariableString("--color-primary");

	return <ActivityIndicator size={"small"} color={color} />;
};
