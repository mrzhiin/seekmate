import type * as v from "valibot";
import type {
	CategorySchema,
	CommentSchema,
	PageConfigSchema,
	PageSchema,
	PostPageSchema,
	PostSchema,
} from "./validation";

export type Category = v.InferOutput<typeof CategorySchema>;

export type Post = v.InferOutput<typeof PostSchema>;

export type Comment = v.InferOutput<typeof CommentSchema>;

export type PageData = v.InferOutput<typeof PageSchema>;

export type PostPageData = v.InferOutput<typeof PostPageSchema>;

export type PageConfig = v.InferOutput<typeof PageConfigSchema>;

export function parsePageString(_pageString: string): PageData {
	throw new Error("Not implemented");
}

export function parsePostPageString(_html: string): PostPageData {
	throw new Error("Not implemented");
}
