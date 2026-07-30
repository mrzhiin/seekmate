import { memo } from "react";
import { Text as RNText } from "react-native";

export const LineBreakRenderer = memo(() => {
	return <RNText selectable>{"\n"}</RNText>;
});
