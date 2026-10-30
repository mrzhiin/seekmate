import type { PostScrollPosition } from "@/components/post/scrollMemory";
import type { Comment, PostPageData } from "@/lib/parser";

export function getPostScrollRestore(
	saved: PostScrollPosition | undefined,
	comments: readonly Pick<Comment, "id" | "floor">[],
	pagination: Pick<PostPageData["pagination"], "currentPage" | "hasNext">,
) {
	const scrollOffset = saved?.scrollOffset;
	const fallback = {
		initialScrollIndex: undefined,
		initialScrollOffset:
			typeof scrollOffset === "number" &&
			Number.isFinite(scrollOffset) &&
			scrollOffset > 1
				? scrollOffset
				: undefined,
		needsMorePages: false,
	};
	const anchor = saved?.anchor;
	if (
		!anchor ||
		typeof anchor.commentId !== "number" ||
		typeof anchor.floor !== "number" ||
		typeof anchor.page !== "number" ||
		typeof anchor.index !== "number" ||
		typeof anchor.viewOffset !== "number" ||
		!Number.isFinite(anchor.commentId) ||
		!Number.isFinite(anchor.floor) ||
		!Number.isSafeInteger(anchor.page) ||
		anchor.page < 1 ||
		!Number.isInteger(anchor.index) ||
		anchor.index < 0 ||
		!Number.isFinite(anchor.viewOffset)
	) {
		return fallback;
	}

	let index = comments.findIndex((comment) => comment.id === anchor.commentId);
	if (index < 0) {
		// 先补齐锚点所在页，不能用不完整列表的像素位置提前恢复。
		if (pagination.hasNext && pagination.currentPage < anchor.page) {
			return { ...fallback, needsMorePages: true };
		}
		index = comments.findIndex((comment) => comment.floor >= anchor.floor);
	}

	return index < 0
		? fallback
		: {
				...fallback,
				initialScrollIndex: {
					// 正文占用列表第 0 项，评论索引顺延一位。
					index: index + 1,
					viewOffset: anchor.viewOffset,
					viewPosition: 0,
				},
				initialScrollOffset: undefined,
			};
}
