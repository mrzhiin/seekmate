import { useNavigation } from "@react-navigation/native";
import * as Application from "expo-application";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "zustand";
import { AuthCheckIn } from "@/components/settings/autoCheckIn";
import { CheckIn } from "@/components/settings/checkIn";
import { ClearImageCache } from "@/components/settings/clearImageCache";
import { Item } from "@/components/settings/Item";
import { Label } from "@/components/settings/Label";
import { Link } from "@/components/settings/link";
import { Locale } from "@/components/settings/locale";
import { NodeImageApiKey } from "@/components/settings/nodeImageApiKey";
import { User } from "@/components/settings/user";
import { config } from "@/lib/config";
import { userStore } from "@/store/userStore";

const Screen = () => {
	const navigation = useNavigation();
	const { t } = useTranslation();
	const userId = useStore(userStore, (state) => state.id);
	const insets = useSafeAreaInsets();

	useEffect(() => {
		navigation.setOptions({
			title: t("settings.title"),
		});
	}, [navigation, t]);

	return (
		<ScrollView
			className="bg-background"
			contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
			showsVerticalScrollIndicator={false}
		>
			<View className="px-4 pt-4 gap-6">
				<View className="overflow-hidden rounded-2xl bg-secondary">
					<User />
				</View>
				<View className="gap-2">
					<Label text={t("settings.preferences")} />
					<View className="overflow-hidden rounded-2xl bg-secondary">
						<AuthCheckIn />
						<CheckIn />
						<NodeImageApiKey key={userId} />
						<ClearImageCache />
						<Locale />
					</View>
				</View>
				<View className="gap-2">
					<Label text={t("settings.about")} />
					<View className="overflow-hidden rounded-2xl bg-secondary">
						<Item
							icon="information-outline"
							label={t("settings.version")}
							subLabel={Application.nativeApplicationVersion || "-"}
						/>
						{config.githubUrl && (
							<Link
								icon="github"
								uri={config.githubUrl}
								label={t("settings.github")}
								subLabel={t("settings.githubSubtitle")}
							/>
						)}
						<Link
							icon="web"
							uri={config.siteUrl}
							label="NodeSeek"
							subLabel={t("settings.siteSubtitle")}
						/>
					</View>
				</View>
			</View>
		</ScrollView>
	);
};

export default Screen;
