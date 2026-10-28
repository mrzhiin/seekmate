import type { MaterialDesignIconsIconName } from "@react-native-vector-icons/material-design-icons";
import type { ReactNode } from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Pressable } from "@/components/pressable";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { Text } from "@/components/ui/text";

export interface ItemProps {
	icon?: MaterialDesignIconsIconName;
	label?: string;
	subLabel?: string;
	onPress?: () => void;
	right?: ReactNode;
	disabled?: boolean;
}

export const Item = ({
	icon,
	label,
	subLabel,
	onPress,
	right,
	disabled,
}: ItemProps) => {
	return (
		<Pressable
			className={twMerge(
				"min-h-18 flex-row items-center gap-4 rounded-xl px-4 py-4",
				disabled && "opacity-50",
			)}
			onPress={onPress}
			disabled={disabled || !onPress}
			accessibilityRole={onPress ? "button" : undefined}
			accessibilityState={{ disabled }}
		>
			{icon && (
				<View importantForAccessibility="no-hide-descendants">
					<MaterialDesignIcons
						name={icon}
						size={24}
						className="text-secondary-foreground"
					/>
				</View>
			)}
			<View className="flex-1 gap-1">
				<Text className="text-base">{label}</Text>
				{subLabel && (
					<Text className="text-sm text-secondary-foreground">{subLabel}</Text>
				)}
			</View>
			{right ??
				(onPress && (
					<MaterialDesignIcons
						name="chevron-right"
						size={22}
						className="text-secondary-foreground"
					/>
				))}
		</Pressable>
	);
};
