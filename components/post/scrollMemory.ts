export type PostScrollPosition = {
	scrollOffset: number;
	headerSize?: number;
	anchor?: {
		commentId: number;
		floor: number;
		page: number;
		index: number;
		viewOffset: number;
	};
};

const MAX_ENTRIES = 100;
const memory = new Map<number, PostScrollPosition>();

export const getPostScrollPosition = (
	postId: number,
): PostScrollPosition | undefined => {
	const value = memory.get(postId);

	if (value) {
		memory.delete(postId);
		memory.set(postId, value);
	}

	return value;
};

export const setPostScrollPosition = (
	postId: number,
	position: PostScrollPosition,
) => {
	if (!Number.isFinite(position.scrollOffset) || position.scrollOffset <= 1) {
		memory.delete(postId);
		return;
	}

	memory.delete(postId);
	memory.set(postId, position);

	if (memory.size > MAX_ENTRIES) {
		memory.delete(memory.keys().next().value as number);
	}
};
