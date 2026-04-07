import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { config } from "@/lib/config";
import { ScreenName } from "@/stack/screenName";
import { Pressable } from "../pressable";

export const SignInPrompt = () => {
	const navigation = useNavigation();
	const { t } = useTranslation();

	return (
		<View className="flex-1">
			<View className="flex-1 justify-center px-6 gap-2">
				<Text className="text-3xl text-primary font-semibold">
					{t("auth.signInPrompt.welcome")}
				</Text>
				<Text className="text-base text-secondary-foreground">
					{t("auth.signInPrompt.description")}
				</Text>
			</View>
			<View className="flex-1 px-6">
				<View
					style={{
						height: 48,
					}}
					className="flex-row"
				>
					<Pressable
						className="rounded-l-full px-2 bg-primary justify-center items-center border-2 border-primary flex-1"
						onPress={() => {
							navigation.navigate(ScreenName.Authenticate);
						}}
					>
						<Text className="text-primary-foreground text-base">
							{t("auth.signInPrompt.signIn")}
						</Text>
					</Pressable>
					<Pressable
						className="rounded-r-full px-2 justify-center items-center border-2 border-primary flex-1"
						onPress={() => {
							navigation.navigate(ScreenName.WebView, {
								uri: new URL("register.html", config.siteUrl).toString(),
							});
						}}
					>
						<Text className="text-base">{t("auth.signInPrompt.register")}</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
};
