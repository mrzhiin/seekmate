import { config } from "@/lib/config";
import {
	CheckInType,
	type CheckInType as CheckInTypeValue,
} from "@/store/appStore";

export interface AttendanceWebViewMessage {
	success: boolean;
	resData?: unknown;
	error?: string;
}

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
(() => {
	const main = async () => {
		const random = ${randomValue};
		const res = await fetch(
			"${url}",
			{
				method: "POST",
			},
		);

		return await res.json();
	};

	main()
		.then((e) => {
			window.ReactNativeWebView.postMessage(
				JSON.stringify({
					success: true,
					resData: e,
				}),
			);
		})
		.catch((e) => {
			window.ReactNativeWebView.postMessage(
				JSON.stringify({
					success: false,
					error: String(e),
				}),
			);
		});
})();
`;
};
