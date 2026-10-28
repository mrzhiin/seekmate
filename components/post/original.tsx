import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { produce } from "immer";
import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useStore } from "zustand";
import { Text } from "@/components/ui/text";
import {
	type usePostOriginalQuery,
	usePostOriginalQueryKey,
} from "@/hooks/services/usePostOriginalQuery";
import type { PostPageData } from "@/lib/parser";
import { queryClient } from "@/lib/query";
import { ToastAndroid } from "@/lib/toast";
import { WebServiceContext } from "@/state/web";
import {
	createAppreciatScript,
	createCollectionScript,
	createUpvoteScript,
} from "@/state/web/scripts";
import { userStore } from "@/store/userStore";
import { Avatar } from "../avatar";
import { Pressable } from "../pressable";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
import { ContentView } from "./contentView";

dayjs.extend(relativeTime);

type PostOriginalData = ReturnType<typeof usePostOriginalQuery>["data"];

export const Original = ({
	data,
	postId,
	onAvatarPress,
}: {
	postId: number;
	data: PostPageData;
	onAvatarPress?: () => void;
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
		<View className="gap-4 border-b border-border pb-3 pt-5">
			<Text className="px-4 text-xl font-semibold" selectable>
				{data.title}
			</Text>
			<View className="flex-row items-center gap-3 px-4">
				<Avatar
					uid={data.author.uid}
					size={40}
					showRank
					enableMenu={false}
					onPress={onAvatarPress}
				/>
				<View className="flex-1 gap-1">
					<View className="flex-row flex-wrap items-center gap-2">
						<Text className="text-base font-semibold">{data.author.name}</Text>
						<View className="rounded-full bg-accent px-2 py-0.5">
							<Text className="text-xs text-accent-foreground">
								{t("post.original.poster")}
							</Text>
						</View>
					</View>
					<View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
						<Text className="text-secondary-foreground dark:text-muted-foreground">
							{dateDisplay}
						</Text>
						<Text className="text-secondary-foreground dark:text-muted-foreground">
							{timeDisplay}
						</Text>
						<Text className="text-secondary-foreground dark:text-muted-foreground">
							{relativeDisplay}
						</Text>
					</View>
				</View>
			</View>
			<View className="px-4">
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
	const { t } = useTranslation();
	const [isFavoritedLoading, setIsFavoritedLoading] = useState(false);
	const [isUpvotedLoading, setIsUpvotedLoading] = useState(false);
	const [isAppreciatedLoading, setIsAppreciatedLoading] = useState(false);
	const webServiceContext = useContext(WebServiceContext);
	const userId = useStore(userStore, (s) => s.id);
	const postOriginalQueryKey = usePostOriginalQueryKey({
		postId,
	});
	const updatePostOriginalQuery = (
		updater: (draftState: NonNullable<PostOriginalData>) => void,
	) => {
		queryClient.setQueryData<PostOriginalData>(postOriginalQueryKey, (prev) => {
			if (!prev) {
				return prev;
			}

			return produce(prev, updater);
		});
	};
	const runInteraction = async ({
		setLoading,
		script,
		onSuccess,
	}: {
		setLoading: (value: boolean) => void;
		script: string;
		onSuccess: () => void;
	}) => {
		if (userId == null) {
			return;
		}

		setLoading(true);
		try {
			await webServiceContext.run(script);
			onSuccess();
		} catch {
			ToastAndroid.show(t("post.interaction.failed"), ToastAndroid.SHORT);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View className="flex-row gap-2 px-4">
			{[
				{
					icon: data.interactions.isUpvoted
						? ("thumb-up" as const)
						: ("thumb-up-outline" as const),
					label: data.interactions.upvoteCount,
					onPress: async () => {
						const commentId = data.commentId;

						if (
							userId == null ||
							commentId == null ||
							data.interactions.isUpvoted
						) {
							return;
						}

						await runInteraction({
							setLoading: setIsUpvotedLoading,
							script: createUpvoteScript({ commentId, action: "add" }),
							onSuccess: () => {
								updatePostOriginalQuery((draftState) => {
									if (draftState.interactions.isUpvoted) {
										return;
									}

									draftState.interactions.isUpvoted = true;
									draftState.interactions.upvoteCount += 1;
								});
							},
						});
					},
					disabled:
						userId == null ||
						isUpvotedLoading ||
						data.interactions.isUpvoted ||
						data.commentId == null,
				},
				// {
				// 	icon: data.interactions.isDownvoted
				// 		? ("thumb-down" as const)
				// 		: ("thumb-down-outline" as const),
				// 	label: data.interactions.downvoteCount,
				// },
				{
					icon: data.interactions.isAppreciated
						? ("food-drumstick" as const)
						: ("food-drumstick-outline" as const),
					label: data.interactions.appreciationCount,
					onPress: async () => {
						const commentId = data.commentId;

						if (
							userId == null ||
							commentId == null ||
							data.interactions.isAppreciated
						) {
							return;
						}

						await runInteraction({
							setLoading: setIsAppreciatedLoading,
							script: createAppreciatScript({ commentId, action: "add" }),
							onSuccess: () => {
								updatePostOriginalQuery((draftState) => {
									if (draftState.interactions.isAppreciated) {
										return;
									}

									draftState.interactions.isAppreciated = true;
									draftState.interactions.appreciationCount += 1;
								});
							},
						});
					},
					disabled:
						userId == null ||
						isAppreciatedLoading ||
						data.interactions.isAppreciated ||
						data.commentId == null,
				},
				{
					icon: data.interactions.isFavorited
						? ("heart" as const)
						: ("heart-outline" as const),
					label: data.interactions.favoriteCount,
					onPress: async () => {
						if (userId == null) {
							return;
						}

						await runInteraction({
							setLoading: setIsFavoritedLoading,
							script: createCollectionScript({
								postId,
								action: data.interactions.isFavorited ? "remove" : "add",
							}),
							onSuccess: () => {
								updatePostOriginalQuery((draftState) => {
									draftState.interactions.isFavorited =
										!draftState.interactions.isFavorited;
									draftState.interactions.favoriteCount = Math.max(
										0,
										draftState.interactions.favoriteCount +
											(draftState.interactions.isFavorited ? 1 : -1),
									);
								});
							},
						});
					},
					disabled: userId == null || isFavoritedLoading,
				},
			].map((x) => {
				return (
					<Pressable
						key={x.icon}
						className="min-h-12 flex-1 items-center justify-center rounded-full"
						onPress={x.onPress}
						disabled={x.disabled}
					>
						<View className="flex-row items-center gap-2">
							<MaterialDesignIcons
								name={x.icon}
								size={20}
								className="text-secondary-foreground dark:text-muted-foreground"
							/>
							<Text className="text-secondary-foreground dark:text-muted-foreground">
								{x.label}
							</Text>
						</View>
					</Pressable>
				);
			})}
		</View>
	);
};
