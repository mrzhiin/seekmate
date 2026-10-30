import assert from "node:assert/strict";
import test from "node:test";
import * as v from "valibot";
import { ErrorUser401Schema, isTrustedAuthUrl } from "../lib/auth/validation";

for (const [status, expected] of [
	[401, true],
	[404, false],
	[403, false],
	[500, false],
] as const) {
	test(`only session failures sign out: status ${status}`, () => {
		assert.equal(
			v.safeParse(ErrorUser401Schema, { status, success: false }).success,
			expected,
		);
	});
}

test("a successful or malformed response is not a session failure", () => {
	for (const data of [null, {}, { status: 401, success: true }]) {
		assert.equal(v.safeParse(ErrorUser401Schema, data).success, false);
	}
});

const origins = ["https://api.example.com", "https://www.example.com"];
for (const [url, expected] of [
	["https://api.example.com/signIn.html", true],
	["https://www.example.com/space/1", true],
	["https://www.example.com:443/", true],
	["https://www.example.com.evil.test/", false],
	["https://evil.test/?next=https://www.example.com", false],
	["https://www.example.com@evil.test/", false],
	["https://attacker@www.example.com/", false],
	["https://www.example.com:8443/", false],
	["http://www.example.com/", false],
	["javascript:alert(1)", false],
	["about:blank", false],
	["not a URL", false],
] as const) {
	test(`validate auth message origin: ${url}`, () => {
		assert.equal(isTrustedAuthUrl(url, origins), expected);
	});
}
