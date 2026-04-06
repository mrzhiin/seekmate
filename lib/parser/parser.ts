import * as cheerio from "cheerio/slim";
import { safeParse } from "valibot";
import type { PageData, Post, PostPageData } from "./types";
import {
	PageConfigSchema,
	PostPageConfigSchema,
	PostSchema,
} from "./validation";

const RE_UID = /\/space\/(\d+)/;
const RE_SLUG = /\/categories\/([^"]*)/;
const RE_AVATAR = /^(.*\/avatar\/(\d+)\.png)$/;
const RE_POST_ID = /post-(\d+)-/;
const RE_VIEWS = /(\d+) views/;
const RE_COMMENTS = /(\d+) comments/;
const RE_PAGE_NUM = /(\d+)/;
const RE_PAGE_ELLIPSIS = /\.\.(\d+)/;
const RE_NEXT_PAGE = /\/page-(\d+)/;

const uidFromHref = (href: string) => href.match(RE_UID)?.[1] ?? "";
const slugFromHref = (href: string) => href.match(RE_SLUG)?.[1] ?? "";
const int = (s: string | undefined, fallback = 0) => {
	const n = parseInt(s ?? "", 10);
	return Number.isNaN(n) ? fallback : n;
};
const str = (s: string | undefined | null, fallback = "") => s ?? fallback;
const parseTime = (s: string) => (s ? Date.parse(s) : 0);

function b64DecodeUnicode(str: string) {
	return decodeURIComponent(
		atob(str)
			.split("")
			.map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
			.join(""),
	);
}

export function parsePageHtml(html: string): PageData {
	const $ = cheerio.load(html);
	const config = extractPageConfig($);

	return {
		categories: config.allCategory.map((c) => ({
			nameZh: c.cn_text,
			slug: c.key,
		})),
		posts: extractPosts($),
		pagination: {
			...extractPagination($),
			pageSize: config.commmentPerPage,
		},
	};
}

export function parsePostPageHtml(html: string): PostPageData {
	const $ = cheerio.load(html);
	const config = extractPostPageConfig($);
	const postData = config.postData;
	const idx = postData.comments.findIndex((c) => c.floorIndex === 0);
	const postBody = idx !== -1 ? postData.comments[idx] : undefined;
	postData.comments.splice(idx, idx !== -1 ? 1 : 0);
	const actualComments = postData.comments;

	return {
		id: postData.postId,
		commentId: postBody?.commentId,
		title: postData.title,
		author: { name: postData.op.name, uid: postData.op.uid },
		category: { nameZh: postData.categoryWord, slug: postData.category },
		contentMarkdown: postBody?.markdown ?? "",
		createdAt: parseTime(postBody?.time.createdDate ?? ""),
		updatedAt: postBody?.time.editedDate
			? parseTime(postBody.time.editedDate)
			: undefined,
		//
		interactions: {
			upvoteCount: postBody?.upvoteCount ?? 0,
			isUpvoted: postBody?.upvoted ?? false,
			downvoteCount: postBody?.dislikeCount ?? 0,
			isDownvoted: postBody?.disliked ?? false,
			appreciationCount: postBody?.likeCount ?? 0,
			isAppreciated: postBody?.liked ?? false,
			favoriteCount: postData.collectionCount,
			isFavorited: postData.collected ?? false,
		},
		//
		comments: actualComments.map((c) => ({
			id: c.commentId,
			floor: c.floorIndex,
			author: { name: c.poster.name, uid: c.poster.uid },
			contentMarkdown: c.markdown,
			createdAt: parseTime(c.time.createdDate),
			isHot: c.hot,
			isPinned: c.pined,
			isBlocked: c.blocked,
			isPoster: c.poster.isOp,
			interactions: {
				upvoteCount: c.upvoteCount,
				isUpvoted: c.upvoted,
				downvoteCount: c.dislikeCount,
				isDownvoted: c.disliked,
				appreciationCount: c.likeCount,
				isAppreciated: c.liked,
				favoriteCount: 0,
				isFavorited: false,
			},
		})),
		pagination: {
			currentPage: config.postData.postPage,
			totalPages: config.postData.postPageCount,
			hasNext: config.postData.postPage < config.postData.postPageCount,
			hasPrev: config.postData.postPage > 1,
			pageSize: config.commmentPerPage,
		},
	};
}

export function extractPageConfig($: ReturnType<typeof cheerio.load>) {
	const jsonText = $("#temp-script").text();
	if (!jsonText) throw new Error("No config script found");
	const config = JSON.parse(b64DecodeUnicode(jsonText));
	const result = safeParse(PageConfigSchema, config);
	if (!result.success) throw new Error("Invalid page config");
	return result.output;
}

export function extractPostPageConfig($: ReturnType<typeof cheerio.load>) {
	const jsonText = $("#temp-script").text();
	if (!jsonText) throw new Error("No config script found");
	const config = JSON.parse(b64DecodeUnicode(jsonText));
	const result = safeParse(PostPageConfigSchema, config);
	if (!result.success) throw new Error("Invalid post page config");
	return result.output;
}

function extractPosts($: ReturnType<typeof cheerio.load>): Post[] {
	const posts: Post[] = [];
	$(".post-list-item").each((_, el) => {
		const post = parsePostElement($, $(el));
		const result = safeParse(PostSchema, post);
		if (result.success) posts.push(result.output);
	});
	return posts;
}

function parsePostElement(
	$: ReturnType<typeof cheerio.load>,
	$el: ReturnType<typeof $>,
): Post {
	const titleEl = $el.find(".post-title");
	const titleLink = titleEl.find("a").first();
	const href = str(titleLink.attr("href"));
	const avatarSrc = str($el.find("img[src*='/avatar/']").first().attr("src"));
	const authorLink = $el.find(".info-author a[href^='/space/']").first();
	const authorUid = uidFromHref(str(authorLink.attr("href")));
	const authorName = authorLink.text().trim();
	const viewsTitle = str($el.find('[title*="views"]').attr("title"));
	const commentsTitle = str($el.find('[title*="comments"]').attr("title"));
	const lastCommenterEl = $el.find(".info-last-commenter a").first();
	const lastCommenterUid = uidFromHref(str(lastCommenterEl.attr("href")));
	const lastCommenterName = lastCommenterEl.text().trim();
	const lastTimeTitle = str(
		$el.find(".info-last-comment-time time").attr("title"),
	);
	const categoryA = $el.find('a[href^="/categories/"]').first();
	const categoryHref = str(categoryA.attr("href"));
	const categoryName = categoryA.text().trim();
	const isPinned = $el.find(".iconpark-icon.pined").length > 0;
	const isAward = $el.find(".iconpark-icon.award").length > 0;
	const isLocked = $el.find(".iconpark-icon use[href='#lock']").length > 0;
	return {
		id: int(href.match(RE_POST_ID)?.[1]),
		title: titleLink.text().trim(),
		author: {
			name: authorName || "",
			uid: authorUid ? int(authorUid) : int(avatarSrc.match(RE_AVATAR)?.[2]),
		},
		views: int(viewsTitle.match(RE_VIEWS)?.[1]),
		commentsCount: int(commentsTitle.match(RE_COMMENTS)?.[1]),
		isPinned,
		isLocked,
		isAward,
		isBlocked: false,
		isAnnouncement: false,
		lastCommenter: {
			name: lastCommenterName || "",
			uid: lastCommenterUid ? int(lastCommenterUid) : 0,
		},
		lastCommentTime: parseTime(lastTimeTitle),
		category: { nameZh: categoryName, slug: slugFromHref(categoryHref) },
	};
}

function extractPagination(
	$: ReturnType<typeof cheerio.load>,
): Pick<
	PageData["pagination"],
	"currentPage" | "hasNext" | "hasPrev" | "totalPages"
> {
	const curText = $(".pager-cur").text();
	const currentPage = int(curText.match(RE_PAGE_NUM)?.[1], 1);
	const prevHasNoLink = $(".pager-prev a").length === 0;
	const nextHref = str($(".pager-next a").attr("href"));
	const ellipsis = $(".ellipsis").closest("[class*='pager']");
	const totalPages = ellipsis.length
		? int(ellipsis.text().match(RE_PAGE_ELLIPSIS)?.[1], 1)
		: 1;
	return {
		currentPage,
		totalPages,
		hasPrev: !prevHasNoLink && currentPage > 1,
		hasNext:
			nextHref.match(RE_NEXT_PAGE)?.[1] !== undefined ||
			currentPage < totalPages,
	};
}
