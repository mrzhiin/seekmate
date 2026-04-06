import * as v from "valibot";

export const ExpoExtraSchema = v.object({
	apiBaseUrl: v.pipe(v.string(), v.nonEmpty()),
	siteUrl: v.pipe(v.string(), v.nonEmpty()),
	githubUrl: v.optional(v.string()),
	sentryDsn: v.optional(v.string()),
});

export type ExpoExtra = v.InferOutput<typeof ExpoExtraSchema>;
