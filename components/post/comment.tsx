import type { Observable } from "@legendapp/state";
import { Computed, observer, useValue } from "@legendapp/state/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Pressable } from "@/components/pressable";
import { Text } from "@/components/ui/text";
import type { Comment as CommentType } from "@/lib/parser";
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
		const createdAt = useValue(item$.createdAt);
		const floor = useValue(item$.floor);
		const authorName = useValue(item$.author.name);
		const authorUid = useValue(item$.author.uid);
		const contentMarkdown = useValue(item$.contentMarkdown);
		const isPoster = useValue(item$.isPoster);

		const [dateDisplay, timeDisplay, relativeDisplay] = useMemo(() => {
			const day = dayjs(createdAt);
			return [day.format("YYYY-MM-DD"), day.format("HH:mm:ss"), day.fromNow()];
		}, [createdAt]);

		return (
			<View className="flex-row py-4 px-4 gap-2">
				<Avatar uid={authorUid} size={40} jump showRank />
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
										icon: item$.interactions.isUpvoted.get()
											? ("thumb-up" as const)
											: ("thumb-up-outline" as const),
										label: item$.interactions.upvoteCount.get(),
									},
									{
										icon: item$.interactions.isDownvoted.get()
											? ("thumb-down" as const)
											: ("thumb-down-outline" as const),
										label: item$.interactions.downvoteCount.get(),
									},
									{
										icon: item$.interactions.isAppreciated.get()
											? ("food-drumstick" as const)
											: ("food-drumstick-outline" as const),
										label: item$.interactions.appreciationCount.get(),
									},
								].map((x) => {
									return (
										<View className="flex-1 items-start" key={x.icon}>
											<Pressable className="rounded-xl px-2 py-0.5" disabled>
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
