import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Pressable } from "../pressable";
import { Text } from "../ui/text";

export const ErrorFallback = ({ onReset }: { onReset?: () => void }) => {
	const { t } = useTranslation();
	return (
		<View className="justify-center items-center gap-1.5 flex-1">
			<Text className="text-2xl text-center text-destructive font-semibold">
				{t("errorFallback.title")}
			</Text>
			<Text className="text-base text-muted-foreground text-center">
				{t("errorFallback.message")}
			</Text>
			{onReset && (
				<Pressable
					onPress={onReset}
					className="rounded-full px-4 py-1 border-border border bg-muted"
				>
					<Text className="text-muted-foreground text-base">
						{t("errorFallback.retry")}
					</Text>
				</Pressable>
			)}
		</View>
	);
};
