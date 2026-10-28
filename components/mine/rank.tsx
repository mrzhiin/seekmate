import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { useUserSuspenseQuery } from "@/hooks/services/useUserQuery";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";

export const Rank = ({
	user,
}: {
	user: ReturnType<typeof useUserSuspenseQuery>["data"];
}) => {
	const { t } = useTranslation();
	const data = user;
	const [next, progress] = useMemo(() => {
		if (data) {
			const nextRank = Math.min(data.rank + 1, 6);
			const next = nextRank * nextRank * 100;
			const prev = (nextRank - 1) * (nextRank - 1) * 100;

			if (next > 0) {
				const progress = Math.round(
					((data.coinCount - prev) / (next - prev)) * 100,
				);
				return [next, progress];
			} else if (next === 0) {
				return [0, 0];
			}
		}

		return [];
	}, [data]);

	if (!data) {
		return null;
	}

	return (
		<View className="flex-row items-center gap-3 px-1 py-4">
			<View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
				<MaterialDesignIcons
					name="trophy"
					size={26}
					className="text-amber-500"
				/>
			</View>
			<View className="flex-1 gap-2">
				<Text className="font-semibold">
					{t("mine.rank.currentLevel", { level: data.rank })}
				</Text>
				<View className="h-1.5 overflow-hidden rounded-full bg-border">
					<View
						style={{
							width: `${progress || 0}%`,
							maxWidth: "100%",
							height: "100%",
						}}
						className="rounded-full bg-primary"
					/>
				</View>
				<View className="flex-row flex-wrap items-center justify-between gap-x-2">
					<Text className="text-xs text-muted-foreground">
						{t("mine.rank.nextLevelDistance")}
					</Text>
					<Text className="text-xs text-muted-foreground">
						{data.coinCount} / {next || "-"}
					</Text>
				</View>
			</View>
		</View>
	);
};
