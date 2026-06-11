import { memo } from "react";
import { Text as RNText } from "react-native";
import emojiMapJSON from "@/assets/fonts/emoji-map.json";

const EMOJI_FONT_FAMILY = "SeekMateEmoji";
const EMOJI_SOURCE_REGEXP = /^([^/]+)\/(\d+)\.[^.]+$/;
const emojiTextStyle = { fontFamily: EMOJI_FONT_FAMILY };

const stripLeadingZeros = (value: string) => value.replace(/^0+(?=\d)/, "");
const escapeRegExp = (value: string) =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const emojiTypes = new Set<string>();

const tokenMap = emojiMapJSON.reduce((map, { src, value }) => {
	const match = EMOJI_SOURCE_REGEXP.exec(src);

	if (!match) {
		return map;
	}

	const [, type, code] = match;
	emojiTypes.add(type);
	map.set(`:${type}${code}:`, value);
	map.set(`:${type}${stripLeadingZeros(code)}:`, value);

	return map;
}, new Map<string, string>());

const emojiTokenPattern =
	Array.from(emojiTypes).map(escapeRegExp).join("|") || "(?!)";

export const EMOJI_TOKEN_REGEXP = new RegExp(
	`:(?:${emojiTokenPattern})\\d+:`,
	"g",
);
export const HAS_EMOJI_TOKEN_REGEXP = new RegExp(
	`:(?:${emojiTokenPattern})\\d+:`,
);
export const isEmojiToken = (token: string) => tokenMap.has(token);

export const EmojiText = memo(
	({ token, className }: { token: string; className?: string }) => {
		const value = tokenMap.get(token);

		if (!value) {
			return token;
		}

		return (
			<RNText style={emojiTextStyle} className={className}>
				{value}
			</RNText>
		);
	},
);
