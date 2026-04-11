import { LegendList, type LegendListRef } from "@legendapp/list/react-native";
import { batch, type observable } from "@legendapp/state";
import {
	Computed,
	Memo,
	observer,
	useObservable,
} from "@legendapp/state/react";
import { useNavigation, useScrollToTop } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { Pressable } from "@/components/pressable";
import { Text } from "@/components/ui/text";
import { useInfinitePostsQuery } from "@/hooks/services/useInfinitePostsQuery";
import { useRefresh } from "@/hooks/useRefresh";
import { config } from "@/lib/config";
import type { Post } from "@/lib/parser";
import { ScreenName } from "@/stack/screenName";
import { Avatar } from "../avatar";
import { ErrorFallback } from "../errorFallback";
import { Spinner } from "../spinner";
import { TrueSheetMenu } from "../trueSheet";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
import { UserItem } from "./userItem";

dayjs.extend(relativeTime);

type PostListQuery = Pick<
	ReturnType<typeof useInfinitePostsQuery>,
	| "data"
	| "fetchNextPage"
	| "hasNextPage"
	| "isFetchingNextPage"
	| "refetch"
	| "isLoading"
	| "isLoadingError"
> & {
	queryKey: readonly unknown[];
};

const PostItem = observer(
	({
		item$,
		onPress,
		onLongPress,
	}: {
		item$: ReturnType<typeof observable<Post>>;
		onPress?: () => void;
		onLongPress?: () => void;
	}) => {
		return (
			<Pressable
				onPress={onPress}
				onLongPress={onLongPress}
				className="flex-row gap-4 px-4 py-4"
			>
				<Computed>
					{() => {
						return (
							<Avatar size={40} uid={item$.author.uid.get()} jump showRank />
						);
					}}
				</Computed>
				<View className="gap-2 flex-1">
					<View className="flex-row items-center">
						<Computed>
							{() => {
								return (
									<Text className="flex-1 text-muted-foreground">
										{item$.author.name.get()}
									</Text>
								);
							}}
						</Computed>
						<View className="flex-row items-center gap-2">
							<Computed>
								{() => {
									return (
										item$.isAward.get() && (
											<MaterialDesignIcons
												name="diamond-stone"
												size={14}
												className="text-amber-500"
											/>
										)
									);
								}}
							</Computed>
							<Computed>
								{() => {
									return (
										item$.isPinned.get() && (
											<MaterialDesignIcons
												name="pin"
												size={14}
												className="text-sky-500"
											/>
										)
									);
								}}
							</Computed>
							<Computed>
								{() => {
									return (
										item$.isLocked.get() && (
											<MaterialDesignIcons
												name="lock"
												size={14}
												className="text-destructive"
											/>
										)
									);
								}}
							</Computed>
							<View className="border border-border px-1 rounded-md bg-muted">
								<Computed>
									{() => {
										return (
											<Text className="text-muted-foreground">
												{item$.category.nameZh.get()}
											</Text>
										);
									}}
								</Computed>
							</View>
						</View>
					</View>
					<Computed>
						{() => {
							return (
								<Text className="text-base" numberOfLines={2}>
									{item$.title.get()}
								</Text>
							);
						}}
					</Computed>
					<View className="flex-row">
						<Computed>
							{() => {
								return [
									{
										key: "view",
										icon: "eye-outline" as const,
										value: item$.views.get(),
									},
									{
										key: "comment",
										icon: "comment-text-outline" as const,
										value: item$.commentsCount.get(),
									},
									{
										key: "reply",
										icon: "reply-outline" as const,
										value: dayjs(item$.lastCommentTime.get()).fromNow(),
									},
								].map((x) => (
									<View
										className="flex-1 flex-row items-center gap-1"
										key={x.key}
									>
										<MaterialDesignIcons name={x.icon} size={12} />
										<Text className="text-muted-foreground text-xs">
											{x.value}
										</Text>
									</View>
								));
							}}
						</Computed>
					</View>
				</View>
			</Pressable>
		);
	},
);

export const PostList = ({
	sortBy = "postTime",
	category,
}: {
	sortBy?: "replyTime" | "postTime";
	category?: string;
}) => {
	const query = useInfinitePostsQuery({
		sortBy,
		category,
	});

	return <PostListView query={query} />;
};

export const PostListView = ({ query }: { query: PostListQuery }) => {
	const listRef = useRef<LegendListRef | null>(null);
	const postsById$ = useObservable<Record<number, Post>>({});
	const [currentPostId, setCurrentPostId] = useState<number | null>(null);
	const navigation = useNavigation();
	const trueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
		isLoading,
		isLoadingError,
		queryKey,
	} = query;

	const refreshFirstPage = useCallback(async () => {
		queryClient.setQueryData<typeof data>(queryKey, (oldData) => {
			if (!oldData) {
				return oldData;
			}

			return {
				...oldData,
				pages: oldData.pages.slice(0, 1),
				pageParams: oldData.pageParams.slice(0, 1),
			};
		});

		await refetch();
	}, [queryClient, queryKey, refetch]);

	const { isRefreshing, refresh } = useRefresh(refreshFirstPage);

	const posts = useMemo(() => {
		const _posts = data?.pages.flatMap((x) => x.posts);

		if (_posts) {
			const postsMap = new Map(_posts.map((x) => [x.id, x]));
			return Array.from(postsMap.values());
		} else {
			return [];
		}
	}, [data?.pages]);

	const Separator = useCallback(
		() => (
			<View
				style={{
					height: 1,
				}}
				className="bg-border"
			/>
		),
		[],
	);

	const renderItem = useCallback(
		({ item }: { item: Post; index: number }) => {
			const item$ = postsById$[item.id];

			if (item$.peek()) {
				return (
					<PostItem
						item$={item$}
						onPress={() => {
							navigation.navigate(ScreenName.Post, {
								id: item.id,
							});
						}}
						onLongPress={() => {
							setCurrentPostId(item.id);
							trueSheetMenuRef.current?.present();
						}}
					/>
				);
			} else {
				return null;
			}
		},
		[postsById$, navigation],
	);

	useEffect(() => {
		if (posts?.length) {
			batch(() => {
				for (let index = 0; index < posts.length; index++) {
					const post = posts[index];

					if (postsById$[post.id].peek()) {
						postsById$[post.id].assign(post);
					} else {
						postsById$[post.id].set(post);
					}
				}
			});
		}
	}, [posts, postsById$]);

	useScrollToTop(listRef);

	if (isLoading) {
		return (
			<View className="flex-1 justify-center items-center">
				<Spinner />
			</View>
		);
	}

	if (isLoadingError) {
		return (
			<View className="flex-1">
				<ErrorFallback />
			</View>
		);
	}

	return (
		<>
			<LegendList
				ref={listRef}
				style={{
					flex: 1,
				}}
				data={posts}
				renderItem={renderItem}
				keyExtractor={(item) => item.id.toString()}
				recycleItems
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
				}
				onEndReached={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage();
					}
				}}
				ItemSeparatorComponent={Separator}
				estimatedItemSize={112}
			/>
			<TrueSheetMenu
				ref={trueSheetMenuRef}
				menus={[
					{
						key: "open",
						icon: "open-in-new",
						label: t("post.menu.openInBrowser"),
						onPress: () => {
							if (currentPostId) {
								const url = new URL(
									`post-${currentPostId}-1`,
									config.apiBaseUrl,
								);
								Linking.openURL(url.toString());
							}
						},
					},
				]}
			>
				<Memo>
					{() => {
						if (currentPostId) {
							const uid = postsById$[currentPostId].author.uid.get();
							return <UserItem uid={uid} />;
						} else {
							return null;
						}
					}}
				</Memo>
			</TrueSheetMenu>
		</>
	);
};
