import * as v from "valibot";
import { getStyle, postStyle } from "@/hooks/services/useStyle";

const SEEKMATE_DATA_V1_COMMENT_PATTERN = /\/\* @seekmate-data-v1:([^\s]*) \*\//;

function parseUserDataFromCss(css: string): UserData {
	const commentMatch = css.match(SEEKMATE_DATA_V1_COMMENT_PATTERN);
	const decodedData = commentMatch
		? JSON.parse(decodeURIComponent(commentMatch[1]))
		: {};
	if (Array.isArray(decodedData)) {
		throw new TypeError("User data must be an object, not an array");
	}
	return v.parse(UserDataSchema, decodedData === null ? {} : decodedData);
}

function embedUserDataInCss(css: string, userData: UserData) {
	const json = JSON.stringify(userData);
	if (json === undefined) {
		throw new TypeError("User data must be JSON-serializable");
	}

	const dataComment = `/* @seekmate-data-v1:${encodeURIComponent(json)} */`;

	return SEEKMATE_DATA_V1_COMMENT_PATTERN.test(css)
		? css.replace(SEEKMATE_DATA_V1_COMMENT_PATTERN, () => dataComment)
		: `${dataComment}\n${css}`;
}

const UserDataSchema = v.looseObject({
	nodeImageApiKey: v.optional(v.string(), ""),
});

export type UserData = v.InferOutput<typeof UserDataSchema>;

export const query = async (signal?: AbortSignal): Promise<UserData> => {
	const css = await getStyle(signal);
	return parseUserDataFromCss(css ?? "");
};

export const update = async (
	localData: UserData,
	signal?: AbortSignal,
): Promise<void> => {
	const css = (await getStyle(signal)) ?? "";
	const remoteData = parseUserDataFromCss(css);
	const mergedData = { ...remoteData, ...localData };
	await postStyle(embedUserDataInCss(css, mergedData), signal);
};
