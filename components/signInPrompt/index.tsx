import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Pressable } from "@/components/pressable";
import { Text } from "@/components/ui/text";
import { config } from "@/lib/config";
import { ScreenName } from "@/stack/screenName";

export const SignInPrompt = () => {
	const navigation = useNavigation();
	const { t } = useTranslation();

	return (
		<View className="flex-1 items-center justify-center px-6 py-8">
			<View
				className="absolute inset-0 overflow-hidden"
				pointerEvents="none"
				importantForAccessibility="no-hide-descendants"
			>
				<View className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-accent opacity-40" />
				<View className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent opacity-30" />
			</View>
			<View className="w-full max-w-sm gap-8">
				<View className="items-center gap-6">
					<View
						className="h-24 w-24 items-center justify-center"
						pointerEvents="none"
						importantForAccessibility="no-hide-descendants"
					>
						<View className="absolute h-20 w-20 rotate-12 rounded-3xl bg-accent" />
						<Image
							source={require("@/assets/app/adaptive-icon.png")}
							style={{
								width: 54,
								height: 54,
								borderRadius: 14,
								transform: [{ rotate: "-6deg" }],
							}}
							contentFit="cover"
							accessible={false}
						/>
						<View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary opacity-60" />
						<View className="absolute bottom-1 left-1 h-1.5 w-1.5 rounded-full bg-primary opacity-40" />
					</View>
					<View className="items-center gap-2">
						<Text
							accessibilityRole="header"
							className="text-center text-3xl font-normal"
						>
							{t("auth.signInPrompt.welcome")}
						</Text>
						<Text className="text-center text-base text-secondary-foreground">
							{t("auth.signInPrompt.description")}
						</Text>
					</View>
				</View>
				<View className="gap-3">
					<Pressable
						accessibilityRole="button"
						className="min-h-14 items-center justify-center overflow-hidden rounded-full bg-primary px-6 py-3"
						onPress={() => {
							navigation.navigate(ScreenName.Authenticate);
						}}
					>
						<Text className="text-base text-primary-foreground">
							{t("auth.signInPrompt.signIn")}
						</Text>
					</Pressable>
					<Pressable
						accessibilityRole="button"
						className="min-h-14 items-center justify-center overflow-hidden rounded-full bg-accent px-6 py-3"
						onPress={() => {
							navigation.navigate(ScreenName.WebView, {
								uri: new URL("register.html", config.siteUrl).toString(),
							});
						}}
					>
						<Text className="text-base text-accent-foreground">
							{t("auth.signInPrompt.register")}
						</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
};
