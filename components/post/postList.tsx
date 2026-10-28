import { LegendList, type LegendListRef } from "@legendapp/list/react-native";
import type { observable } from "@legendapp/state";
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
import { RefreshControl, View } from "react-native";
import { Pressable } from "@/components/pressable";
import { Text } from "@/components/ui/text";
import { useInfinitePostsQuery } from "@/hooks/services/useInfinitePostsQuery";
import { useRefresh } from "@/hooks/useRefresh";
import { config } from "@/lib/config";
import type { Post } from "@/lib/parser";
import { ScreenName } from "@/stack/screenName";
import { Avatar, AvatarMenu } from "../avatar";
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
		onAvatarPress,
	}: {
		item$: ReturnType<typeof observable<Post>>;
		onPress?: () => void;
		onLongPress?: () => void;
		onAvatarPress?: () => void;
	}) => {
		return (
			<Pressable
				onPress={onPress}
				onLongPress={onLongPress}
				className="flex-row gap-3 px-4 py-4"
			>
				<Computed>
					{() => {
						return (
							<Avatar
								size={48}
								uid={item$.author.uid.get()}
								showRank
								enableMenu={false}
								onPress={onAvatarPress}
							/>
						);
					}}
				</Computed>
				<View className="flex-1 gap-1">
					<View className="flex-row items-center">
						<Computed>
							{() => {
								return (
									<Text className="flex-1 font-semibold" numberOfLines={1}>
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
							<View className="rounded-full bg-muted px-2 py-0.5">
								<Computed>
									{() => {
										return (
											<Text className="text-secondary-foreground dark:text-muted-foreground">
												{item$.category.nameZh.get()}
											</Text>
										);
									}}
								</Computed>
							</View>
						</View>
					</View>
					<View className="flex-row items-start gap-1.5">
						<Computed>
							{() =>
								item$.isLocked.get() ? (
									<View className="pt-1">
										<MaterialDesignIcons
											name="lock"
											size={14}
											className="text-rose-400 dark:text-rose-400"
										/>
									</View>
								) : null
							}
						</Computed>
						<Computed>
							{() => (
								<Text className="flex-1 text-base" numberOfLines={2}>
									{item$.title.get()}
								</Text>
							)}
						</Computed>
					</View>
					<View className="mt-2 flex-row">
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
										className="flex-1 flex-row items-center gap-1.5"
										key={x.key}
									>
										<MaterialDesignIcons
											name={x.icon}
											size={14}
											className="text-secondary-foreground dark:text-muted-foreground"
										/>
										<Text className="text-xs text-secondary-foreground dark:text-muted-foreground">
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
	const [currentAvatarUid, setCurrentAvatarUid] = useState<
		number | undefined
	>();
	const navigation = useNavigation();
	const trueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const avatarMenuRef = useRef<TrueSheetMenu>(null);
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
		() => <View className="ml-19 h-px bg-border opacity-50" />,
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
						onAvatarPress={() => {
							const uid = item$.author.uid.peek();

							if (uid) {
								setCurrentAvatarUid(uid);
								avatarMenuRef.current?.present();
							}
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
		postsById$.set(Object.fromEntries(posts.map((post) => [post.id, post])));
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
			<AvatarMenu ref={avatarMenuRef} uid={currentAvatarUid} />
		</>
	);
};
