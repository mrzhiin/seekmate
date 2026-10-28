import { memo } from "react";
import { Text } from "react-native";

export const LineBreakRenderer = memo(() => {
	return <Text selectable>{"\n"}</Text>;
});
