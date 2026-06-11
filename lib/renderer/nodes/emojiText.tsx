import { memo } from "react";
import { Text as RNText } from "react-native";
import emojiMapJSON from "@/assets/fonts/emoji-map.json";

const EMOJI_FONT_FAMILY = "SeekMateEmoji";
const EMOJI_SOURCE_REGEXP = /^([^/]+)\/(\d+)\.[^.]+$/;

const stripLeadingZeros = (value: string) => value.replace(/^0+(?=\d)/, "");

const tokenMap = emojiMapJSON.reduce((map, { src, value }) => {
	const match = EMOJI_SOURCE_REGEXP.exec(src);

	if (!match) {
		return map;
	}

	const [, type, code] = match;
	map.set(`:${type}${code}:`, value);
	map.set(`:${type}${stripLeadingZeros(code)}:`, value);

	return map;
}, new Map<string, string>());

export const EmojiText = memo(
	({ token, className }: { token: string; className?: string }) => {
		const value = tokenMap.get(token);

		if (!value) {
			return token;
		}

		return (
			<RNText style={{ fontFamily: EMOJI_FONT_FAMILY }} className={className}>
				{value}
			</RNText>
		);
	},
);
