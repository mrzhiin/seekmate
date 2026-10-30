import assert from "node:assert/strict";
import test from "node:test";
import { upsertGradleProperty } from "../plugins/withSignedPlugin";

for (const [value, escaped] of [
	["ordinary-password", "ordinary-password"],
	[
		String.raw`C:\keys\release.keystore`,
		String.raw`C:\\keys\\release.keystore`,
	],
	[String.raw`pass\word`, String.raw`pass\\word`],
	["  leading and trailing ", String.raw`\  leading and trailing `],
	["line\nbreak\r\ttab\f", String.raw`line\u000abreak\u000d\u0009tab\u000c`],
	["密码🔑", String.raw`\u5bc6\u7801\ud83d\udd11`],
	["#:=!$secret", "#:=!$secret"],
] as const) {
	test(`escape signing property: ${JSON.stringify(value)}`, () => {
		assert.deepEqual(upsertGradleProperty([], "PASSWORD", value), [
			`PASSWORD=${escaped}`,
		]);
	});
}

test("updating signing properties is idempotent and preserves unrelated keys", () => {
	const lines = ["# signing", "OTHER=value", "PASSWORD=old"];
	const value = String.raw`new\password`;
	upsertGradleProperty(lines, "PASSWORD", value);
	upsertGradleProperty(lines, "PASSWORD", value);
	assert.deepEqual(lines, [
		"# signing",
		"OTHER=value",
		String.raw`PASSWORD=new\\password`,
	]);
});
