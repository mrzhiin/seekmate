import { LegendList } from "@legendapp/list/react-native";
import { batch } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useNavigation } from "@react-navigation/native";
import type { InfiniteData } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { type ScrollViewProps, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import {
	KeyboardChatScrollView,
	type KeyboardChatScrollViewProps,
	KeyboardGestureArea,
	KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";
import { useStore } from "zustand";
import { BackPrevent } from "@/components/backPrevent";
import { ListFooter } from "@/components/list/footer";
import { Comment } from "@/components/post/comment";
import { InputBar } from "@/components/post/inputBar";
import { Original } from "@/components/post/original";
import { Pressable } from "@/components/pressable";
import { TrueSheetMenu } from "@/components/trueSheet";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import {
	fetchPostCommentsPage,
	type PostInfiniteCommentsPage,
	postInfiniteCommentsQueryKey,
	usePostInfiniteCommentsQuery,
} from "@/hooks/services/usePostInfiniteCommentsQuery";
import { useRefresh } from "@/hooks/useRefresh";
import { config } from "@/lib/config";
import type { Comment as CommentType, PostPageData } from "@/lib/parser";
import { userStore } from "@/store/userStore";

const VirtualizedListScrollView = (
	props: ScrollViewProps & KeyboardChatScrollViewProps,
) => {
	return <KeyboardChatScrollView {...props} />;
};

export const PostView = ({
	id,
	postData,
}: {
	id: number;
	postData: PostPageData;
}) => {
	const navigation = useNavigation();
	const userId = useStore(userStore, (s) => s.id);
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const inputBarRef = useRef<InputBar>(null);
	const trueSheetRef = useRef<TrueSheetMenu>(null);
	const stickyHeight = useSharedValue(0);
	const commentsById$ = useObservable<
		Record<
			number,
			CommentType & {
				currentPage: number;
				postId: number;
			}
		>
	>({});

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
		isFetching,
	} = usePostInfiniteCommentsQuery({
		postId: id,
	});
	const refreshFirstPage = useCallback(async () => {
		const queryKey = postInfiniteCommentsQueryKey(id);

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
	}, [id, queryClient, refetch]);
	const { isRefreshing, refresh } = useRefresh(refreshFirstPage);

	const comments = useMemo(() => {
		const _comments = data?.pages.flatMap((x) =>
			x.comments.map((c) => ({
				...c,
				currentPage: x.pagination.currentPage,
				postId: x.id,
			})),
		);

		if (_comments) {
			const commentsMap = new Map(_comments.map((x) => [x.id, x]));
			return Array.from(commentsMap.values());
		} else {
			return [];
		}
	}, [data?.pages]);

	const renderItem = useCallback(
		({ item }: { item: CommentType; index: number }) => {
			const item$ = commentsById$[item.id];
			return (
				<Comment
					item$={item$}
					posterUserId={postData.author.uid}
					onReply={() => {
						const author = item$.author.peek();

						if (author) {
							inputBarRef.current?.appendText(
								`@${author.name} [#${item$.floor.peek()}](${config.apiBaseUrl}post-${item$.postId.peek()}-${item$.currentPage.peek()}#${item$.floor.peek()}) `,
							);
						}
					}}
				/>
			);
		},
		[commentsById$, postData.author.uid],
	);
	const memoList = useCallback(
		(props: ScrollViewProps) => (
			<VirtualizedListScrollView
				{...props}
				extraContentPadding={stickyHeight}
				keyboardLiftBehavior="always"
			/>
		),
		[stickyHeight],
	);

	const refreshLastCommentsPage = useCallback(async () => {
		const queryKey = postInfiniteCommentsQueryKey(id);
		const cachedData =
			queryClient.getQueryData<
				InfiniteData<PostInfiniteCommentsPage, { currentPage: number }>
			>(queryKey);

		const lastPageParam = cachedData?.pageParams.at(-1);

		if (!lastPageParam) {
			await queryClient.invalidateQueries({
				queryKey,
				exact: true,
			});
			return;
		}

		const refreshedTailPages: PostInfiniteCommentsPage[] = [];
		const refreshedTailPageParams: Array<{ currentPage: number }> = [];

		let currentPage = lastPageParam.currentPage;
		let totalPages = currentPage;

		do {
			const page = await fetchPostCommentsPage({
				postId: id,
				currentPage,
			});

			refreshedTailPages.push(page);
			refreshedTailPageParams.push({ currentPage });
			totalPages = Math.max(totalPages, page.pagination.totalPages);
			currentPage += 1;
		} while (currentPage <= totalPages);

		queryClient.setQueryData<
			InfiniteData<PostInfiniteCommentsPage, { currentPage: number }>
		>(queryKey, (prev) => {
			if (!prev?.pages.length) {
				return prev;
			}

			return {
				pages: [...prev.pages.slice(0, -1), ...refreshedTailPages],
				pageParams: [
					...prev.pageParams.slice(0, -1),
					...refreshedTailPageParams,
				],
			};
		});
	}, [id, queryClient]);

	useEffect(() => {
		if (comments?.length) {
			batch(() => {
				for (let index = 0; index < comments.length; index++) {
					const comment = comments[index];

					if (commentsById$[comment.id].peek()) {
						commentsById$[comment.id].assign(comment);
					} else {
						commentsById$[comment.id].set(comment);
					}
				}
			});
		}
	}, [comments, commentsById$]);

	useEffect(() => {
		navigation.setOptions({
			title: "",
			headerRight: () => {
				return (
					<Pressable
						className="-mr-2 rounded-full justify-center items-center"
						style={{
							height: 40,
							aspectRatio: 1,
						}}
						onPress={() => {
							trueSheetRef.current?.present();
						}}
					>
						<MaterialDesignIcons name="dots-vertical" size={24} />
					</Pressable>
				);
			},
		});
	}, [navigation]);

	return (
		<View
			style={{
				flex: 1,
			}}
		>
			<KeyboardGestureArea
				style={{
					flex: 1,
					justifyContent: "flex-end",
				}}
			>
				<LegendList
					style={{
						flex: 1,
					}}
					data={comments}
					renderItem={renderItem}
					keyExtractor={(x) => x.id.toString()}
					recycleItems
					ListHeaderComponent={<Original postId={id} data={postData} />}
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
					ListFooterComponent={
						<ListFooter
							isFetchingNextPage={isFetchingNextPage}
							hasNextPage={hasNextPage}
							isFetching={isFetching}
						/>
					}
					ItemSeparatorComponent={() => {
						return (
							<View
								className="bg-border"
								style={{
									height: 1,
								}}
							/>
						);
					}}
					renderScrollComponent={memoList}
				/>
				{userId && (
					<KeyboardStickyView
						style={{
							position: "absolute",
							width: "100%",
						}}
					>
						<View
							onLayout={(event) => {
								stickyHeight.value = event.nativeEvent.layout.height;
							}}
						>
							<InputBar
								postId={id}
								ref={inputBarRef}
								onPost={refreshLastCommentsPage}
							/>
						</View>
					</KeyboardStickyView>
				)}
			</KeyboardGestureArea>
			<TrueSheetMenu
				ref={trueSheetRef}
				menus={[
					{
						key: "open",
						icon: "open-in-new",
						label: t("post.menu.openInBrowser"),
						onPress: () => {
							const url = new URL(`post-${id}-1`, config.apiBaseUrl);
							Linking.openURL(url.toString());
						},
					},
				]}
			>
				<BackPrevent
					onBackPress={() => {
						trueSheetRef.current?.dismiss();
					}}
				/>
			</TrueSheetMenu>
		</View>
	);
};
