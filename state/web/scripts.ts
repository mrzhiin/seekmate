import { config } from "@/lib/config";
import {
	CheckInType,
	type CheckInType as CheckInTypeValue,
} from "@/store/appStore";

const createRequestScript = (
	path: string,
	payload?: Record<string, unknown>,
	headers: Record<string, string> = {},
) => `
const res = await fetch(${JSON.stringify(new URL(path, config.apiBaseUrl).toString())}, {
	method: "POST",
	body: ${payload ? `JSON.stringify(${JSON.stringify(payload)})` : "undefined"},
	headers: ${JSON.stringify({ "Content-Type": "application/json", ...headers })},
});
const body = await res.json();
if (!res.ok || !body || body.success !== true) {
	throw new Error("Request failed (HTTP " + res.status + ")");
}
return { status: res.status, body };
`;

export const createAttendanceScript = (checkInType: CheckInTypeValue) =>
	createRequestScript(
		`api/attendance?random=${checkInType === CheckInType.Random}`,
	);

const csrfHeaders = () => ({
	"csrf-token": Array.from({ length: 16 }, () =>
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
			Math.floor(Math.random() * 62),
		),
	).join(""),
});

export const createPostCommentScript = (payload: Record<string, unknown>) =>
	createRequestScript("api/content/new-comment", payload, csrfHeaders());

export const createPostScript = (payload: {
	content: string;
	title: string;
	category: string;
	mode: "new-discussion";
	rank: number;
}) => createRequestScript("api/content/new-discussion", payload, csrfHeaders());

export const createCollectionScript = (payload: {
	postId: number;
	action: "remove" | "add";
}) => createRequestScript("api/statistics/collection", payload);

export const createUpvoteScript = (payload: {
	commentId: number;
	action: "add";
}) => createRequestScript("api/statistics/upvote", payload);

export const createAppreciatScript = (payload: {
	commentId: number;
	action: "add";
}) => createRequestScript("api/statistics/like", payload);

export const createBanScript = (payload: { block_member_name: string }) =>
	createRequestScript("api/block-list/add", payload);
