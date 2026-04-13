import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { produce } from "immer";
import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import {
	type usePostOriginalQuery,
	usePostOriginalQueryKey,
} from "@/hooks/services/usePostOriginalQuery";
import type { PostPageData } from "@/lib/parser";
import { queryClient } from "@/lib/query";
import { WebServiceContext } from "@/state/web";
import { createCollectionScript } from "@/state/web/scripts";
import { Avatar } from "../avatar";
import { Pressable } from "../pressable";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
import { ContentView } from "./contentView";

dayjs.extend(relativeTime);

export const Original = ({
	data,
	postId,
}: {
	postId: number;
	data: PostPageData;
}) => {
	const { t } = useTranslation();
	const [dateDisplay, timeDisplay, relativeDisplay] = useMemo(() => {
		const createdAt = data?.createdAt;

		if (createdAt) {
			const d = dayjs(createdAt);
			return [d.format("YYYY-MM-DD"), d.format("HH:mm:ss"), d.fromNow()];
		}

		return [];
	}, [data?.createdAt]);

	return (
		<View className="pt-4 pb-2 gap-1.5 border-b border-border">
			<Text className="px-4 text-xl" selectable>
				{data.title}
			</Text>
			<View className="pl-4 pr-2 flex-row items-center gap-3">
				<Avatar uid={data.author.uid} size={40} showRank />
				<View className="flex-1 items-center flex-row gap-x-2 gap-y-1 flex-wrap">
					<Text className="text-base"> {data.author.name}</Text>
					<View className="rounded-2xl px-2 py-1 bg-primary justify-center items-center">
						<Text className="text-xs text-primary-foreground">
							{t("post.original.poster")}
						</Text>
					</View>
				</View>
			</View>
			<View className="px-4 flex-row items-center">
				<Text className="text-muted-foreground">{dateDisplay}</Text>
				<MaterialDesignIcons
					size={12}
					name="circle-medium"
					className="text-muted-foreground"
				/>
				<Text className="text-muted-foreground">{timeDisplay}</Text>
				<MaterialDesignIcons
					size={12}
					name="circle-medium"
					className="text-muted-foreground"
				/>
				<Text className="text-muted-foreground">{relativeDisplay}</Text>
			</View>
			<View className="px-4 py-2">
				{data.contentMarkdown && (
					<ContentView
						markdown={data.contentMarkdown}
						textClassName="text-lg"
					/>
				)}
			</View>
			<Interactions postId={postId} data={data} />
		</View>
	);
};

const Interactions = ({
	data,
	postId,
}: {
	postId: number;
	data: PostPageData;
}) => {
	const [isFavoritedLoading, setIsFavoritedLoading] = useState(false);
	const webServiceContext = useContext(WebServiceContext);
	const postOriginalQueryKey = usePostOriginalQueryKey({
		postId,
	});

	return (
		<View className="px-2 gap-2 flex-row">
			{[
				{
					icon: data.interactions.isUpvoted
						? ("thumb-up" as const)
						: ("thumb-up-outline" as const),
					label: data.interactions.upvoteCount,
				},
				{
					icon: data.interactions.isDownvoted
						? ("thumb-down" as const)
						: ("thumb-down-outline" as const),
					label: data.interactions.downvoteCount,
				},
				{
					icon: data.interactions.isAppreciated
						? ("food-drumstick" as const)
						: ("food-drumstick-outline" as const),
					label: data.interactions.appreciationCount,
				},
				{
					icon: data.interactions.isFavorited
						? ("heart" as const)
						: ("heart-outline" as const),
					label: data.interactions.favoriteCount,
					onPress: async () => {
						const isChecked = data.interactions.isFavorited;
						const payload = {
							postId,
							action: isChecked ? ("remove" as const) : ("add" as const),
						};

						setIsFavoritedLoading(true);
						webServiceContext
							.run(createCollectionScript(payload))
							?.then(() => {
								queryClient.setQueryData<
									ReturnType<typeof usePostOriginalQuery>["data"]
								>(postOriginalQueryKey, (prev) => {
									if (!prev) {
										return prev;
									}

									return produce(prev, (draftState) => {
										draftState.interactions.isFavorited = !isChecked;
									});
								});
							})
							.finally(() => {
								setIsFavoritedLoading(false);
							});
					},
					disabled: isFavoritedLoading,
				},
			].map((x) => {
				return (
					<Pressable
						key={x.icon}
						className="flex-1 py-2 rounded-xl"
						onPress={x.onPress}
						disabled={x.disabled || true}
					>
						<View className="gap-0.5 items-center">
							<Text className="text-muted-foreground">{x.label}</Text>
							<MaterialDesignIcons
								name={x.icon}
								size={20}
								className="text-muted-foreground"
							/>
						</View>
					</Pressable>
				);
			})}
		</View>
	);
};
