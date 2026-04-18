import { batch, type Observable } from "@legendapp/state";
import { Computed, observer, useValue } from "@legendapp/state/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useStore } from "zustand";
import { Pressable } from "@/components/pressable";
import { Text } from "@/components/ui/text";
import type { Comment as CommentType } from "@/lib/parser";
import { WebServiceContext } from "@/state/web";
import { createAppreciatScript, createUpvoteScript } from "@/state/web/scripts";
import { userStore } from "@/store/userStore";
import { Avatar } from "../avatar";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
import { ContentView } from "./contentView";

dayjs.extend(relativeTime);

export const Comment = observer(
	(props: {
		item$: Observable<CommentType>;
		posterUserId?: number;
		onReply?: () => void;
	}) => {
		const { t } = useTranslation();
		const item$ = props.item$;
		const webServiceContext = useContext(WebServiceContext);
		const userId = useStore(userStore, (s) => s.id);
		const [isUpvotedLoading, setIsUpvotedLoading] = useState(false);
		const [isAppreciatedLoading, setIsAppreciatedLoading] = useState(false);

		const createdAt = useValue(item$.createdAt);
		const floor = useValue(item$.floor);
		const authorName = useValue(item$.author.name);
		const authorUid = useValue(item$.author.uid);
		const contentMarkdown = useValue(item$.contentMarkdown);
		const isPoster = useValue(item$.isPoster);
		const commentId = useValue(item$.id);
		const isUpvoted = useValue(item$.interactions.isUpvoted);
		const upvoteCount = useValue(item$.interactions.upvoteCount);
		const isAppreciated = useValue(item$.interactions.isAppreciated);
		const appreciationCount = useValue(item$.interactions.appreciationCount);

		const [dateDisplay, timeDisplay, relativeDisplay] = useMemo(() => {
			const day = dayjs(createdAt);
			return [day.format("YYYY-MM-DD"), day.format("HH:mm:ss"), day.fromNow()];
		}, [createdAt]);

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
				const promise = webServiceContext.run(script);

				if (!promise) {
					return;
				}

				await promise;
				onSuccess();
			} finally {
				setLoading(false);
			}
		};

		return (
			<View className="flex-row py-4 px-4 gap-2">
				<Avatar uid={authorUid} size={40} showRank />
				<View className="flex-1">
					<View className="flex-row">
						<View className="flex-1 gap-1">
							<View className="flex-1 flex-row items-center gap-3">
								<View className="flex-1 items-center flex-row gap-x-2 gap-y-1 flex-wrap">
									<Text className="text-base">{authorName}</Text>
									<Text className="text-muted-foreground">#{floor}</Text>
									{isPoster && (
										<View className="rounded-xl px-1.5 py-0.5 bg-primary justify-center items-center">
											<Text className="text-xs text-primary-foreground">
												{t("post.original.poster")}
											</Text>
										</View>
									)}
								</View>
							</View>
							<View className="flex-row items-center">
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
								{/* <View className="flex-1 justify-end flex-row items-center gap-1">
							<Text className="text-muted-foreground">#{floor}</Text>
						</View> */}
							</View>
						</View>
						<View className="flex-row items-center">
							<Pressable
								className="rounded-full justify-center items-center"
								style={{
									height: 40,
									aspectRatio: 1,
								}}
								onPress={() => {
									props.onReply?.();
								}}
							>
								<MaterialDesignIcons name="reply-outline" size={24} />
							</Pressable>
						</View>
					</View>
					<ContentView markdown={contentMarkdown} textClassName="text-base" />
					<View className="flex-row -ml-2">
						<Computed>
							{() => {
								return [
									{
										icon: isUpvoted
											? ("thumb-up" as const)
											: ("thumb-up-outline" as const),
										label: upvoteCount,
										onPress: async () => {
											if (userId == null || commentId == null || isUpvoted) {
												return;
											}

											await runInteraction({
												setLoading: setIsUpvotedLoading,
												script: createUpvoteScript({
													commentId,
													action: "add",
												}),
												onSuccess: () => {
													batch(() => {
														if (item$.interactions.isUpvoted.peek()) {
															return;
														}

														item$.interactions.isUpvoted.set(true);
														item$.interactions.upvoteCount.set(
															item$.interactions.upvoteCount.peek() + 1,
														);
													});
												},
											});
										},
										disabled:
											userId == null ||
											isUpvotedLoading ||
											isUpvoted ||
											commentId == null,
									},
									// {
									// 	icon: item$.interactions.isDownvoted.get()
									// 		? ("thumb-down" as const)
									// 		: ("thumb-down-outline" as const),
									// 	label: item$.interactions.downvoteCount.get(),
									// },
									{
										icon: isAppreciated
											? ("food-drumstick" as const)
											: ("food-drumstick-outline" as const),
										label: appreciationCount,
										onPress: async () => {
											if (
												userId == null ||
												commentId == null ||
												isAppreciated
											) {
												return;
											}

											await runInteraction({
												setLoading: setIsAppreciatedLoading,
												script: createAppreciatScript({
													commentId,
													action: "add",
												}),
												onSuccess: () => {
													batch(() => {
														if (item$.interactions.isAppreciated.peek()) {
															return;
														}

														item$.interactions.isAppreciated.set(true);
														item$.interactions.appreciationCount.set(
															item$.interactions.appreciationCount.peek() + 1,
														);
													});
												},
											});
										},
										disabled:
											userId == null ||
											isAppreciatedLoading ||
											isAppreciated ||
											commentId == null,
									},
								].map((x) => {
									return (
										<View className="flex-1 items-start" key={x.icon}>
											<Pressable
												className="rounded-xl px-2 py-0.5"
												onPress={x.onPress}
												disabled={x.disabled}
											>
												<View className="flex-row gap-2 items-center">
													<MaterialDesignIcons
														name={x.icon}
														size={16}
														style={{
															width: 16,
															aspectRatio: 1,
														}}
														className="text-muted-foreground"
													/>
													<Text className="text-muted-foreground">
														{x.label}
													</Text>
												</View>
											</Pressable>
										</View>
									);
								});
							}}
						</Computed>
					</View>
				</View>
			</View>
		);
	},
);
