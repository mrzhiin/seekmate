import * as v from "valibot";

const InteractionsSchema = v.object({
	upvoteCount: v.number(),
	isUpvoted: v.boolean(),
	downvoteCount: v.number(),
	isDownvoted: v.boolean(),
	appreciationCount: v.number(),
	isAppreciated: v.boolean(),
	favoriteCount: v.number(),
	isFavorited: v.boolean(),
});

const UnViewedCountSchema = v.object({
	message: v.number(),
	atMe: v.number(),
	reply: v.number(),
	all: v.number(),
});

const UserSchema = v.object({
	member_id: v.number(),
	member_name: v.string(),
	isAdmin: v.boolean(),
	rank: v.number(),
	coin: v.number(),
	stardust: v.number(),
	bio: v.nullable(v.string()),
	created_at: v.string(),
	roles: v.array(v.object({ name: v.string(), display_text: v.string() })),
	nPost: v.number(),
	nComment: v.number(),
	follows: v.number(),
	fans: v.number(),
	collectionCount: v.number(),
	unViewedCount: UnViewedCountSchema,
});

const CategoryConfigSchema = v.object({
	key: v.string(),
	cn_text: v.string(),
	icon: v.string(),
	showInNav: v.boolean(),
	adminOnly: v.boolean(),
	customizable: v.boolean(),
	showInIndex: v.boolean(),
});

const TopicOpSchema = v.object({
	uid: v.number(),
	name: v.string(),
});

const RotateTopicLastCommenterSchema = v.object({
	uid: v.number(),
	name: v.string(),
	profile: v.string(),
});

const RotateTopicSchema = v.object({
	op: v.object({
		uid: v.number(),
		name: v.string(),
		avatar: v.string(),
		profile: v.string(),
	}),
	lastCommenter: RotateTopicLastCommenterSchema,
	titleText: v.string(),
	titleLink: v.string(),
	postId: v.number(),
	isAnnouncement: v.boolean(),
	views: v.string(),
	comments: v.number(),
	lastCommentDate: v.string(),
	lastCommentDateFormated: v.string(),
	lastCommentDateRel: v.string(),
	lastCommentLink: v.string(),
	category: v.string(),
	categoryWord: v.string(),
	categoryLink: v.string(),
	rank: v.number(),
	pined: v.boolean(),
	locked: v.boolean(),
	award: v.boolean(),
	blocked: v.boolean(),
});

export const PageConfigSchema = v.object({
	user: v.nullish(UserSchema),
	allCategory: v.array(CategoryConfigSchema),
	rotateTopics: v.nullish(v.array(RotateTopicSchema)),
	commmentPerPage: v.number(),
	enableCustomedStyle: v.boolean(),
});

const PosterSchema = v.object({
	name: v.string(),
	uid: v.number(),
	info: v.string(),
	avatar: v.string(),
	profile: v.string(),
	isOp: v.boolean(),
	isMe: v.boolean(),
	roles: v.array(v.object({ name: v.string(), display_text: v.string() })),
});

const TimeSchema = v.object({
	createdDate: v.string(),
	createdDateFormated: v.string(),
	editedDate: v.nullable(v.string()),
	editedDateFormated: v.nullable(v.string()),
	createdDateRel: v.string(),
	editedDateRel: v.nullable(v.string()),
});

const CommentConfigSchema = v.object({
	commentId: v.number(),
	hot: v.boolean(),
	pined: v.boolean(),
	floorIndex: v.number(),
	poster: PosterSchema,
	time: TimeSchema,
	markdown: v.string(),
	liked: v.boolean(),
	disliked: v.boolean(),
	upvoted: v.boolean(),
	likeCount: v.number(),
	dislikeCount: v.number(),
	upvoteCount: v.number(),
	signature: v.nullable(v.string()),
	blocked: v.boolean(),
});

const PostDataSchema = v.object({
	category: v.string(),
	categoryWord: v.string(),
	categoryLink: v.string(),
	postId: v.number(),
	postPage: v.number(),
	rank: v.number(),
	title: v.string(),
	views: v.string(),
	postPageCount: v.number(),
	collectionCount: v.number(),
	collected: v.boolean(),
	op: TopicOpSchema,
	locked: v.number(),
	award: v.number(),
	comments: v.array(CommentConfigSchema),
});

export const PostPageConfigSchema = v.object({
	user: v.nullish(UserSchema),
	allCategory: v.array(CategoryConfigSchema),
	postData: PostDataSchema,
	commmentPerPage: v.number(),
	enableCustomedStyle: v.boolean(),
});

export const CategorySchema = v.object({
	nameZh: v.string(),
	slug: v.pipe(v.string(), v.trim(), v.nonEmpty()),
});

export const AuthorSchema = v.object({
	uid: v.number(),
	name: v.string(),
});

export const PostSchema = v.object({
	id: v.number(),
	title: v.string(),
	author: AuthorSchema,
	views: v.number(),
	commentsCount: v.number(),
	isPinned: v.boolean(),
	isLocked: v.boolean(),
	isAward: v.boolean(),
	isBlocked: v.boolean(),
	isAnnouncement: v.boolean(),
	lastCommenter: v.optional(AuthorSchema),
	lastCommentTime: v.number(),
	category: CategorySchema,
});

export const PaginationSchema = v.object({
	currentPage: v.number(),
	totalPages: v.number(),
	hasNext: v.boolean(),
	hasPrev: v.boolean(),
	pageSize: v.number(),
});

export const PageSchema = v.object({
	categories: v.array(CategorySchema),
	posts: v.array(PostSchema),
	pagination: PaginationSchema,
});

export const CommentSchema = v.object({
	id: v.number(),
	floor: v.number(),
	author: AuthorSchema,
	contentMarkdown: v.string(),
	createdAt: v.number(),
	isHot: v.boolean(),
	isPinned: v.boolean(),
	isBlocked: v.boolean(),
	isPoster: v.boolean(),
	interactions: InteractionsSchema,
});

export const PostPageSchema = v.object({
	id: v.number(),
	commentId: v.nullish(v.number()),
	title: v.string(),
	contentMarkdown: v.string(),
	createdAt: v.number(),
	updatedAt: v.optional(v.number()),
	author: AuthorSchema,
	category: CategorySchema,
	comments: v.array(CommentSchema),
	pagination: PaginationSchema,
	interactions: InteractionsSchema,
});
