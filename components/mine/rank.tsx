import { useMemo } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { useUserSuspenseQuery } from "@/hooks/services/useUserQuery";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";

export const Rank = ({
	user,
}: {
	user: ReturnType<typeof useUserSuspenseQuery>["data"];
}) => {
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
		<View className="bg-muted p-4 items-center rounded-xl flex-row gap-4">
			<MaterialDesignIcons name="trophy" size={32} color={"#FF9800"} />
			<View className="flex-1 gap-1">
				<Text>{`当前等级 Lv.${data.rank}`}</Text>
				<View
					style={{
						height: 8,
					}}
					className="rounded bg-muted-foreground"
				>
					<View
						style={{
							width: `${progress || 0}%`,
							maxWidth: "100%",
							height: "100%",
						}}
						className="rounded bg-primary"
					/>
				</View>
				<View className="flex-row justify-between items-center">
					<Text className="text-xs">距离下一等级</Text>
					<View className="flex-row items-center">
						<Text className="text-xs">{data.coinCount}</Text>
						<MaterialDesignIcons name="slash-forward" size={12} />
						<Text className="text-xs">{next || "-"}</Text>
					</View>
				</View>
			</View>
		</View>
	);
};
