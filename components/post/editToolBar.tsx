import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariableString } from "@/hooks/useStyle";
import type { HeadingLevel } from "../editor";
import { Pressable } from "../pressable";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";

type EditToolBarProps = {
	onUndoPress?: () => void;
	onRedoPress?: () => void;
	onHeadingPress?: (h: HeadingLevel) => void;
	onParagraphPress?: () => void;
	onBoldPress?: () => void;
	onItalicPress?: () => void;
	onBulletedListPress?: () => void;
	onImagePress?: () => void;
};

const ToolbarButton = ({
	icon,
	label,
	onPress,
}: {
	icon: ComponentProps<typeof MaterialDesignIcons>["name"];
	label: string;
	onPress?: () => void;
}) => (
	<Pressable
		accessibilityLabel={label}
		accessibilityRole="button"
		className="rounded-full justify-center items-center h-9 w-9"
		hitSlop={4}
		onPress={onPress}
	>
		<MaterialDesignIcons name={icon} size={20} className="text-primary" />
	</Pressable>
);

export const EditToolBar = ({
	onUndoPress,
	onRedoPress,
	onHeadingPress,
	onParagraphPress,
	onBoldPress,
	onItalicPress,
	onBulletedListPress,
	// onImagePress,
}: EditToolBarProps) => {
	const { t } = useTranslation();
	const boxShadowColor = useCSSVariableString("--color-border");
	const linearColor = useCSSVariableString("--color-background");
	const insets = useSafeAreaInsets();

	return (
		<View
			style={{
				paddingBottom: insets.bottom,
			}}
		>
			<LinearGradient
				colors={["transparent", linearColor ?? "transparent"]}
				start={{ x: 0.5, y: 0 }}
				end={{ x: 0.5, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>

			<View className="flex-row justify-between items-center">
				<View
					className="bg-secondary flex-row rounded-4xl border border-background m-4 p-1 gap-1"
					style={{
						boxShadow: [
							{
								offsetX: 0,
								offsetY: 0,
								blurRadius: 4,
								color: boxShadowColor,
							},
						],
					}}
				>
					<ToolbarButton
						icon="format-header-2"
						label={t("post.editor.toolbar.heading2")}
						onPress={() => {
							onHeadingPress?.("h2");
						}}
					/>
					<ToolbarButton
						icon="format-header-3"
						label={t("post.editor.toolbar.heading3")}
						onPress={() => {
							onHeadingPress?.("h3");
						}}
					/>
					<ToolbarButton
						icon="format-paragraph"
						label={t("post.editor.toolbar.paragraph")}
						onPress={onParagraphPress}
					/>
					<ToolbarButton
						icon="format-bold"
						label={t("post.editor.toolbar.bold")}
						onPress={onBoldPress}
					/>
					<ToolbarButton
						icon="format-italic"
						label={t("post.editor.toolbar.italic")}
						onPress={onItalicPress}
					/>
					<ToolbarButton
						icon="format-list-bulleted"
						label={t("post.editor.toolbar.bulletedList")}
						onPress={onBulletedListPress}
					/>
					{/* <ToolbarButton
						icon="image-outline"
						label="Image"
						onPress={onImagePress}
					/> */}
				</View>
				<View
					className="bg-secondary flex-row rounded-4xl border border-background m-4 p-1 gap-1"
					style={{
						boxShadow: [
							{
								offsetX: 0,
								offsetY: 0,
								blurRadius: 4,
								color: boxShadowColor,
							},
						],
					}}
				>
					<ToolbarButton
						icon="undo"
						label={t("post.editor.toolbar.undo")}
						onPress={onUndoPress}
					/>
					<ToolbarButton
						icon="redo"
						label={t("post.editor.toolbar.redo")}
						onPress={onRedoPress}
					/>
				</View>
			</View>
		</View>
	);
};
