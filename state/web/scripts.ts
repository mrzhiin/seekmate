import { config } from "@/lib/config";
import {
	CheckInType,
	type CheckInType as CheckInTypeValue,
} from "@/store/appStore";

export const createAttendanceScript = (checkInType: CheckInTypeValue) => {
	const randomValue =
		checkInType === CheckInType.Random
			? "Math.random().toString(36).substring(2, 15)"
			: "false";

	const url = new URL(
		`api/attendance?random=${randomValue}`,
		config.apiBaseUrl,
	).toString();

	return `
const res = await fetch(
    "${url}",
    {
        method: "POST",
    },
);

return await res.json();
`;
};

function generateRandomString(length: number) {
	let result = "";
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charsLength = chars.length;
	let index = 0;
	while (index < length) {
		result += chars.charAt(Math.floor(Math.random() * charsLength));
		index += 1;
	}
	return result;
}

export const createPostCommentScript = (payload: Record<string, unknown>) => {
	const url = new URL("api/content/new-comment", config.apiBaseUrl).toString();
	const t = generateRandomString(16);

	return `
const data = ${JSON.stringify(payload)};
const res = await fetch(
	"${url}",
	{
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
			"csrf-token": "${t}"
		},
	},
);

let body = null;
try {
	body = await res.json();
} catch (_) {
	body = null;
}

if (!res.ok) {
	throw new Error(
		JSON.stringify({
			status: res.status,
			body,
		}),
	);
}

return {
	status: res.status,
	body,
};
`;
};

export const createCollectionScript = (payload: {
	postId: number;
	action: "remove" | "add";
}) => {
	const url = new URL(
		"api/statistics/collection",
		config.apiBaseUrl,
	).toString();

	return `
const data = ${JSON.stringify(payload)};
const res = await fetch(
	${JSON.stringify(url)},
	{
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
		},
	},
);

return await res.json();
`;
};

export const createUpvoteScript = (payload: {
	commentId: number;
	action: "add";
}) => {
	const url = new URL("api/statistics/upvote", config.apiBaseUrl).toString();

	return `
const data = ${JSON.stringify(payload)};
const res = await fetch(
	${JSON.stringify(url)},
	{
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
		},
	},
);

return await res.json();
`;
};

export const createAppreciatScript = (payload: {
	commentId: number;
	action: "add";
}) => {
	const url = new URL("api/statistics/like", config.apiBaseUrl).toString();

	return `
const data = ${JSON.stringify(payload)};
const res = await fetch(
	${JSON.stringify(url)},
	{
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
		},
	},
);

return await res.json();
`;
};
