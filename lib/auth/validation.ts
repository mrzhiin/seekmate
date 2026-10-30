import * as v from "valibot";

export const ErrorUser401Schema = v.object({
	status: v.literal(401),
	success: v.literal(false),
});

export const isTrustedAuthUrl = (
	url: string,
	trustedOrigins: readonly string[],
): boolean => {
	try {
		const parsed = new URL(url);
		return (
			parsed.protocol === "https:" &&
			!parsed.username &&
			!parsed.password &&
			trustedOrigins.includes(parsed.origin)
		);
	} catch {
		return false;
	}
};
