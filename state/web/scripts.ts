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
