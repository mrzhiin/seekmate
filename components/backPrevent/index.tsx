import { useEffect } from "react";
import { BackHandler } from "react-native";

export const BackPrevent = ({ onBackPress }: { onBackPress?: () => void }) => {
	useEffect(() => {
		const backHandler = BackHandler.addEventListener(
			"hardwareBackPress",
			() => {
				onBackPress?.();
				return true;
			},
		);

		return () => backHandler.remove();
	}, [onBackPress]);
	return null;
};
