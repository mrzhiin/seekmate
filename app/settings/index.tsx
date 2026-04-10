import type { MaterialDesignIconsIconName } from "@react-native-vector-icons/material-design-icons";
import { useNavigation } from "@react-navigation/native";
import * as Application from "expo-application";
import { type ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Pressable } from "@/components/pressable";
import { AuthCheckIn } from "@/components/settings/autoCheckIn";
import { CheckIn } from "@/components/settings/checkIn";
import { ClearImageCache } from "@/components/settings/clearImageCache";
import { Link } from "@/components/settings/link";
import { Locale } from "@/components/settings/locale";
import { User } from "@/components/settings/user";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { Text } from "@/components/ui/text";
import { config } from "@/lib/config";

const Label = ({ text }: { text?: string }) => {
	return <Text className="text-base px-6 py-2">{text}</Text>;
};

const Item = ({
	icon,
	label,
	subLabel,
	onPress,
	right,
}: {
	icon?: MaterialDesignIconsIconName;
	label?: string;
	subLabel?: string;
	onPress?: () => void;
	right?: ReactNode;
}) => {
	return (
		<Pressable
			className="flex-row px-6 py-4  gap-4 items-center"
			onPress={onPress}
		>
			{icon && <MaterialDesignIcons name="delete-empty" size={32} />}
			<View className="gap-0.5 flex-1">
				<Text className="text-lg">{label}</Text>
				{subLabel && <Text className="text-sm">{subLabel}</Text>}
			</View>
			{right}
			{/* {iconRight && <MaterialDesignIcons name={iconRight} size={24} />} */}
		</Pressable>
	);
};

const Screen = () => {
	const navigation = useNavigation();
	const { t } = useTranslation();

	useEffect(() => {
		navigation.setOptions({
			title: t("settings.title"),
		});
	}, [navigation, t]);

	return (
		<ScrollView>
			<View>
				<User />
				<AuthCheckIn />
				<CheckIn />
				<ClearImageCache />
				<Locale />
				<Label text={t("settings.about")} />
				<Item
					label={t("settings.version")}
					subLabel={Application.nativeApplicationVersion || "-"}
				/>
				{config.githubUrl && (
					<Link
						uri={config.githubUrl}
						label={t("settings.github")}
						subLabel={t("settings.githubSubtitle")}
					/>
				)}
				<Link
					uri={config.siteUrl}
					label="NodeSeek"
					subLabel={t("settings.siteSubtitle")}
				/>
			</View>
		</ScrollView>
	);
};

export default Screen;
