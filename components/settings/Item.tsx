import type { MaterialDesignIconsIconName } from "@react-native-vector-icons/material-design-icons";
import type { ReactNode } from "react";
import { View } from "react-native";
import { Pressable } from "@/components/pressable";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { Text } from "@/components/ui/text";

export interface ItemProps {
	icon?: MaterialDesignIconsIconName;
	label?: string;
	subLabel?: string;
	onPress?: () => void;
	right?: ReactNode;
}

export const Item = ({ icon, label, subLabel, onPress, right }: ItemProps) => {
	return (
		<Pressable
			className="flex-row px-6 py-4 gap-4 items-center"
			onPress={onPress}
		>
			{icon && <MaterialDesignIcons name="delete-empty" size={32} />}
			<View className="gap-0.5 flex-1">
				<Text className="text-lg">{label}</Text>
				{subLabel && <Text className="text-sm">{subLabel}</Text>}
			</View>
			{right}
		</Pressable>
	);
};
