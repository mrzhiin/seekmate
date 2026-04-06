import { View } from "react-native";
import { Pressable } from "../pressable";
import { Text } from "../ui/text";

export const ErrorFallback = ({ onReset }: { onReset?: () => void }) => {
	return (
		<View className="justify-center items-center gap-1.5 flex-1">
			<Text className="text-2xl text-center text-destructive font-semibold">
				Error
			</Text>
			<Text className="text-base text-muted-foreground text-center">
				糟糕！出了点问题
			</Text>
			{onReset && (
				<Pressable
					onPress={onReset}
					className="rounded-full px-4 py-1 border-border border bg-muted"
				>
					<Text className="text-muted-foreground text-base">重试</Text>
				</Pressable>
			)}
		</View>
	);
};
