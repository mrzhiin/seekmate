import dayjs from "dayjs";
import * as v from "valibot";
import i18n from "@/i18n";
import { mmkvStorage, StorageKey } from "./core";

export const ViewedPostSchema = v.object({
	id: v.number(),
	title: v.string(),
	excerpt: v.string(),
	viewedAt: v.number(),
});

export const ViewedPostsSchema = v.array(ViewedPostSchema);

export const ViewedPostInputSchema = v.object({
	id: v.number(),
	title: v.string(),
	excerpt: v.string(),
	viewedAt: v.optional(v.number()),
});

export type ViewedPost = v.InferOutput<typeof ViewedPostSchema>;
type ViewedPostInput = v.InferOutput<typeof ViewedPostInputSchema>;

const MAX_VIEWED_POSTS = 20;

export const parseViewedPosts = (value?: string) => {
	if (!value) {
		return [];
	}

	try {
		const result = v.safeParse(ViewedPostsSchema, JSON.parse(value));

		if (!result.success) {
			return [];
		}

		return result.output;
	} catch {
		return [];
	}
};

export const getViewedPosts = (): ViewedPost[] => {
	return parseViewedPosts(mmkvStorage.getString(StorageKey.RecentViewedPosts));
};

export const setViewedPosts = (posts: ViewedPost[]) => {
	mmkvStorage.set(StorageKey.RecentViewedPosts, JSON.stringify(posts));
};

export const clearViewedPosts = () => {
	mmkvStorage.remove(StorageKey.RecentViewedPosts);
};

export const toViewedPostExcerpt = (contentMarkdown: string) => {
	return contentMarkdown
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/[>#*_`~-]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 120);
};

export const upsertViewedPost = (post: ViewedPostInput) => {
	const result = v.safeParse(ViewedPostInputSchema, post);

	if (!result.success) {
		return;
	}

	const nextPost: ViewedPost = {
		...result.output,
		viewedAt: result.output.viewedAt ?? Date.now(),
	};

	const dedupedPosts = getViewedPosts().filter(
		(item) => item.id !== nextPost.id,
	);

	setViewedPosts([nextPost, ...dedupedPosts].slice(0, MAX_VIEWED_POSTS));
};

export const formatViewedAt = (value: number) => {
	const viewedAt = dayjs(value);
	const diffDays = dayjs().startOf("day").diff(viewedAt.startOf("day"), "day");
	const time = viewedAt.format("HH:mm");

	if (diffDays <= 0) {
		return time;
	}

	if (diffDays === 1) {
		return i18n.t("mine.recentViewedPosts.time.yesterday", {
			time,
		});
	}

	if (diffDays < 7) {
		return i18n.t("mine.recentViewedPosts.time.daysAgo", {
			count: diffDays,
		});
	}

	return viewedAt.format("YYYY/M/D");
};
