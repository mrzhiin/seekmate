import { LegendList, type LegendListRef } from "@legendapp/list/react-native";
import { useObservable } from "@legendapp/state/react";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import {
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, type ScrollViewProps, View } from "react-native";
import {
	KeyboardChatScrollView,
	type KeyboardChatScrollViewProps,
	KeyboardGestureArea,
	KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";
import { useStore } from "zustand";
import { AvatarMenu } from "@/components/avatar";
import { BackPrevent } from "@/components/backPrevent";
import { ErrorFallback } from "@/components/errorFallback";
import { ListFooter } from "@/components/list/footer";
import { Comment } from "@/components/post/comment";
import { InputBar } from "@/components/post/inputBar";
import { Original } from "@/components/post/original";
import {
	getPostScrollPosition,
	type PostScrollPosition,
	setPostScrollPosition,
} from "@/components/post/scrollMemory";
import { getPostScrollRestore } from "@/components/post/scrollRestore";
import { Pressable } from "@/components/pressable";
import { Spinner } from "@/components/spinner";
import { TrueSheetMenu } from "@/components/trueSheet";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import {
	fetchPostCommentsPage,
	usePostInfiniteCommentsQuery,
} from "@/hooks/services/usePostInfiniteCommentsQuery";
import { usePostOriginalQueryKey } from "@/hooks/services/usePostOriginalQuery";
import { useRefresh } from "@/hooks/useRefresh";
import { config } from "@/lib/config";
import type { Comment as CommentType, PostPageData } from "@/lib/parser";
import {
	postInfiniteCommentsQueryKey,
	refreshPostCommentsTail,
} from "@/lib/query/postComments";
import { Sentry } from "@/lib/sentry";
import { ToastAndroid } from "@/lib/toast";
import { userStore } from "@/store/userStore";

const VirtualizedListScrollView = forwardRef<
	React.ComponentRef<typeof KeyboardChatScrollView>,
	ScrollViewProps & KeyboardChatScrollViewProps
>((props, ref) => {
	return <KeyboardChatScrollView {...props} ref={ref} />;
});

type PostViewProps = {
	id: number;
	postData: PostPageData;
};

type PostComment = CommentType & { currentPage: number; postId: number };

export const PostView = ({ id, postData }: PostViewProps) => {
	const [savedPosition] = useState(() => getPostScrollPosition(id));
	const commentsQuery = usePostInfiniteCommentsQuery({
		postId: id,
		initialPage: postData,
	});
	const { data, fetchNextPage, isFetching, isError } = commentsQuery;

	const comments = useMemo(() => {
		const items = data.pages.flatMap((page) =>
			page.comments.map((comment) => ({
				...comment,
				currentPage: page.pagination.currentPage,
				postId: page.id,
			})),
		);
		return Array.from(new Map(items.map((item) => [item.id, item])).values());
	}, [data.pages]);

	const restore = useMemo(
		() =>
			getPostScrollRestore(
				savedPosition,
				comments,
				data.pages.at(-1)?.pagination ?? postData.pagination,
			),
		[savedPosition, comments, data.pages, postData.pagination],
	);
	const [initialScroll, setInitialScroll] = useState(() =>
		restore.needsMorePages ? undefined : restore,
	);

	useEffect(() => {
		if (initialScroll) return;
		if (!restore.needsMorePages) {
			setInitialScroll(restore);
		} else if (!isFetching && !isError) {
			void fetchNextPage({ cancelRefetch: false });
		}
	}, [initialScroll, restore, isFetching, isError, fetchNextPage]);

	if (!initialScroll) {
		if (isError && !isFetching) {
			return (
				<ErrorFallback
					onReset={() => {
						if (commentsQuery.isFetchNextPageError) {
							void fetchNextPage({ cancelRefetch: false });
						} else {
							void commentsQuery.refetch();
						}
					}}
				/>
			);
		}
		return (
			<View className="flex-1 justify-center items-center">
				<Spinner />
			</View>
		);
	}

	// 补齐分页后才挂载列表，初始恢复参数在本次阅读期间保持不变。
	return (
		<PostViewContent
			id={id}
			postData={postData}
			comments={comments}
			commentsQuery={commentsQuery}
			initialScroll={initialScroll}
		/>
	);
};

const PostViewContent = ({
	id,
	postData,
	comments,
	commentsQuery,
	initialScroll,
}: PostViewProps & {
	comments: PostComment[];
	commentsQuery: ReturnType<typeof usePostInfiniteCommentsQuery>;
	initialScroll: ReturnType<typeof getPostScrollRestore>;
}) => {
	const navigation = useNavigation();
	const userId = useStore(userStore, (s) => s.id);
	const [currentAvatarUid, setCurrentAvatarUid] = useState<
		number | undefined
	>();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const inputBarRef = useRef<InputBar>(null);
	const trueSheetRef = useRef<TrueSheetMenu>(null);
	const avatarMenuRef = useRef<TrueSheetMenu>(null);
	const handleAvatarPress = useCallback((uid: number) => {
		setCurrentAvatarUid(uid);
		avatarMenuRef.current?.present();
	}, []);
	const legendListRef = useRef<LegendListRef | null>(null);
	const listReadyRef = useRef(false);
	// 首次进入也等待布局完成，避免正文出现前先露出页脚。
	const [isListVisible, setIsListVisible] = useState(false);
	const stickyHeight = useSharedValue(0);
	const commentsById$ = useObservable<Record<number, PostComment>>(() =>
		Object.fromEntries(comments.map((comment) => [comment.id, comment])),
	);

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
		isFetching,
		isError,
		isFetchNextPageError,
	} = commentsQuery;
	const originalQueryKey = usePostOriginalQueryKey({ postId: id });

	const refreshFirstPage = useCallback(async () => {
		const queryKey = postInfiniteCommentsQueryKey(id, userId);

		try {
			await queryClient.cancelQueries({ queryKey });
			await queryClient.refetchQueries(
				{ queryKey: originalQueryKey, exact: true },
				{ throwOnError: true },
			);
			const refreshedPost =
				queryClient.getQueryData<PostPageData>(originalQueryKey);
			if (!refreshedPost) return;

			queryClient.setQueryData<typeof data>(queryKey, {
				pages: [refreshedPost],
				pageParams: [{ currentPage: 1 }],
			});
		} catch (error) {
			Sentry.captureException(error);
			ToastAndroid.show(t("errorFallback.message"), ToastAndroid.LONG);
		}
	}, [id, userId, queryClient, originalQueryKey, t]);

	const { isRefreshing, refresh } = useRefresh(refreshFirstPage);

	const commentsRef = useRef(comments);
	commentsRef.current = comments;
	// Android 的 Header 高度变化不保持位置；正文作为列表项参与图片加载后的尺寸补偿。
	const listData = useMemo(() => [postData, ...comments], [postData, comments]);

	const renderItem = useCallback(
		({ item }: { item: PostPageData | PostComment; index: number }) => {
			if ("comments" in item) {
				return (
					<Original
						postId={id}
						data={item}
						onAvatarPress={() => handleAvatarPress(item.author.uid)}
					/>
				);
			}
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
					onAvatarPress={handleAvatarPress}
				/>
			);
		},
		[commentsById$, handleAvatarPress, postData.author.uid, id],
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
		const queryKey = postInfiniteCommentsQueryKey(id, userId);
		await refreshPostCommentsTail(
			queryClient,
			queryKey,
			(currentPage, signal) =>
				fetchPostCommentsPage({ postId: id, currentPage, signal }),
		);
	}, [id, userId, queryClient]);

	useEffect(() => {
		let stateRead = false;
		const saveScrollPosition = () => {
			// 恢复途中离开时保留旧位置，不记录初始化的顶部或中间位置。
			if (stateRead || !listReadyRef.current) {
				return;
			}

			try {
				const list = legendListRef.current;
				if (!list) {
					return;
				}

				const state = list.getState();
				if (!state) {
					return;
				}

				stateRead = true;
				const scroll = state.scroll;
				const headerSize = state.sizeAtIndex(0);
				let anchor: PostScrollPosition["anchor"];

				// 第 0 项是正文；评论位置已包含正文高度，不再重复累加。
				if (
					typeof scroll === "number" &&
					Number.isFinite(scroll) &&
					typeof headerSize === "number" &&
					Number.isFinite(headerSize) &&
					headerSize > 0 &&
					scroll > headerSize &&
					Number.isInteger(state.start) &&
					state.start > 0 &&
					state.start <= commentsRef.current.length
				) {
					try {
						const comment = commentsRef.current[state.start - 1];
						const position = state.positionAtIndex(state.start);
						const viewOffset = position - scroll;

						if (
							typeof comment.id === "number" &&
							typeof comment.floor === "number" &&
							typeof comment.currentPage === "number" &&
							Number.isFinite(position) &&
							Number.isFinite(viewOffset)
						) {
							anchor = {
								commentId: comment.id,
								floor: comment.floor,
								page: comment.currentPage,
								index: state.start - 1,
								viewOffset,
							};
						}
					} catch {
						// 原生位置计算失败时使用像素位置兜底。
					}
				}

				setPostScrollPosition(id, {
					scrollOffset: typeof scroll === "number" ? scroll : Number.NaN,
					headerSize,
					anchor,
				});
			} catch {
				// 原生 ref/state 失败时交给 cleanup 重试。
			}
		};

		const unsubscribe = navigation.addListener(
			"beforeRemove",
			saveScrollPosition,
		);

		return () => {
			saveScrollPosition();
			unsubscribe();
		};
	}, [id, navigation]);

	useEffect(() => {
		commentsById$.set(
			Object.fromEntries(comments.map((comment) => [comment.id, comment])),
		);
	}, [comments, commentsById$]);

	useEffect(() => {
		navigation.setOptions({
			title: "",
			headerRight: () => {
				return (
					<View className="overflow-hidden rounded-full bg-secondary">
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("post.menu.more")}
							className="items-center justify-center"
							style={{
								height: 48,
								aspectRatio: 1,
							}}
							onPress={() => {
								trueSheetRef.current?.present();
							}}
						>
							<MaterialDesignIcons name="dots-vertical" size={24} />
						</Pressable>
					</View>
				);
			},
		});
	}, [navigation, t]);

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
					opacity: isListVisible ? 1 : 0,
				}}
				pointerEvents={isListVisible ? "auto" : "none"}
				importantForAccessibility={
					isListVisible ? "auto" : "no-hide-descendants"
				}
			>
				<LegendList
					ref={legendListRef}
					style={{
						flex: 1,
					}}
					initialScrollIndex={initialScroll.initialScrollIndex}
					initialScrollOffset={initialScroll.initialScrollOffset}
					alwaysRender={{ top: 1 }}
					getItemType={(item) => ("comments" in item ? "original" : "comment")}
					onReady={async () => {
						const list = legendListRef.current;
						if (!list || listReadyRef.current) return;

						try {
							// onReady 后仍可能有尺寸补偿，等待原生定位完成再显示。
							if (initialScroll.initialScrollIndex) {
								await list.scrollToIndex({
									...initialScroll.initialScrollIndex,
									animated: false,
								});
							} else if (initialScroll.initialScrollOffset) {
								await list.scrollToOffset({
									offset: initialScroll.initialScrollOffset,
									animated: false,
								});
							}
						} catch (error) {
							Sentry.captureException(error);
						}

						if (legendListRef.current !== list) return;
						listReadyRef.current = true;
						setIsListVisible(true);
					}}
					data={listData}
					renderItem={renderItem}
					keyExtractor={(item) =>
						"comments" in item ? "original" : item.id.toString()
					}
					recycleItems
					showsHorizontalScrollIndicator={false}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
					}
					onEndReached={() => {
						if (hasNextPage && !isFetching && !isRefreshing && !isError) {
							fetchNextPage();
						}
					}}
					ListFooterComponent={
						<ListFooter
							isFetchingNextPage={isFetchingNextPage}
							hasNextPage={hasNextPage}
							isFetching={isFetching}
							isError={isError}
							onRetry={() => {
								if (isFetchNextPageError) fetchNextPage();
								else refetch();
							}}
						/>
					}
					ItemSeparatorComponent={({ leadingItem }) =>
						"comments" in leadingItem ? null : (
							<View className="ml-17 h-px bg-border opacity-50" />
						)
					}
					renderScrollComponent={memoList}
				/>
				{userId ? (
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
								onPost={() => {
									refreshLastCommentsPage().catch((error: unknown) => {
										Sentry.captureException(error);
										ToastAndroid.show(
											t("errorFallback.message"),
											ToastAndroid.LONG,
										);
									});
								}}
							/>
						</View>
					</KeyboardStickyView>
				) : null}
			</KeyboardGestureArea>
			{!isListVisible && (
				<View className="absolute inset-0 justify-center items-center">
					<Spinner />
				</View>
			)}
			<AvatarMenu ref={avatarMenuRef} uid={currentAvatarUid} />
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
