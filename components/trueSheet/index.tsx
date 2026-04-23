import {
	TrueSheet as RNTrueSheet,
	type TrueSheetProps as RNTrueSheetProps,
} from "@lodev09/react-native-true-sheet";
import type { MaterialDesignIconsIconName } from "@react-native-vector-icons/material-design-icons";
import type { Ref } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useResolveClassNames } from "uniwind";
import { Pressable } from "../pressable";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
import { Text } from "../ui/text";

type TrueSheetProps = RNTrueSheetProps & {
	ref?: Ref<RNTrueSheet>;
};

export const TrueSheet = ({ children, ref, ...props }: TrueSheetProps) => {
	const backgroundStyle = useResolveClassNames("bg-card");

	return (
		<RNTrueSheet
			{...props}
			ref={ref}
			headerStyle={{
				...backgroundStyle,
				...props.headerStyle,
			}}
			style={{
				...backgroundStyle,
				...props.style,
			}}
		>
			{children}
		</RNTrueSheet>
	);
};

export type TrueSheetMenu = RNTrueSheet;

export const TrueSheetMenu = ({
	children,
	menus,
	ref,
	...rest
}: TrueSheetProps & {
	menus: {
		key: string;
		icon?: MaterialDesignIconsIconName;
		label: string;
		checked?: boolean;
		onPress: () => void;
	}[];
}) => {
	return (
		<TrueSheet ref={ref} scrollable={false} detents={["auto"]} {...rest}>
			<GestureHandlerRootView
				style={{
					flexGrow: 1,
				}}
			>
				<View className="pt-8 pb-6">
					{children}
					{menus.map((x) => {
						return (
							<Pressable
								key={x.key}
								className="flex-row items-center gap-4 py-3.5 px-6"
								onPress={x.onPress}
							>
								{x.icon && (
									<MaterialDesignIcons
										name={x.icon}
										size={24}
										className={
											x.checked ? "text-primary" : "text-secondary-foreground"
										}
									/>
								)}
								<Text className="text-base text-secondary-foreground">
									{x.label}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</GestureHandlerRootView>
		</TrueSheet>
	);
};
