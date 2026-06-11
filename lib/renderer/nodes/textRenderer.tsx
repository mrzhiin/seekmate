import { TEXT_TYPE_TO_FORMAT, type TextFormatType } from "lexical";
import { memo, type ReactNode, useContext, useMemo } from "react";
import { Text as RNText } from "react-native";
import { NodeContext } from "../context";
import type { ExtractFromPredicate, isTextNode } from "../types";
import {
	EMOJI_TOKEN_REGEXP,
	EmojiText,
	HAS_EMOJI_TOKEN_REGEXP,
	isEmojiToken,
} from "./emojiText";

const formatClassNameMap = new Map<TextFormatType | string, string>([
	["code", "text-slate-300 bg-slate-600"],
	["bold", "font-bold"],
	["underline", "underline"],
	["italic", "italic"],
	["highlight", "text-primary-foreground bg-primary"],
	["strikethrough", "line-through"],
	["subscript", "text-xs align-baseline"],
	["superscript", "text-xs align-super"],
	["lowercase", "lowercase"],
	["uppercase", "uppercase"],
	["capitalize", "capitalize"],
]);

const renderTextWithEmojiPlaceholders = (text: string, className?: string) => {
	if (!HAS_EMOJI_TOKEN_REGEXP.test(text)) return text;

	EMOJI_TOKEN_REGEXP.lastIndex = 0;

	const parts: ReactNode[] = [];
	let lastIndex = 0;
	let match = EMOJI_TOKEN_REGEXP.exec(text);

	while (match !== null) {
		const token = match[0];
		const index = match.index;
		const isValidEmojiToken = isEmojiToken(token);

		if (isValidEmojiToken && index > lastIndex) {
			parts.push(text.slice(lastIndex, index));
		}

		if (isValidEmojiToken) {
			parts.push(
				<EmojiText
					key={`${token}-${index}`}
					token={token}
					className={className}
				/>,
			);
			lastIndex = index + token.length;
		}

		match = EMOJI_TOKEN_REGEXP.exec(text);
	}

	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex));
	}

	return parts;
};

export const TextRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isTextNode> }) => {
		const nodeContext = useContext(NodeContext);

		const styleClassName = useMemo(() => {
			const classNames = [nodeContext.textClassName];

			for (const [textType, format] of Object.entries(TEXT_TYPE_TO_FORMAT)) {
				if ((node.format & format) === 0) {
					continue;
				}

				classNames.push(formatClassNameMap.get(textType) ?? "");
			}

			return classNames.filter(Boolean).join(" ");
		}, [node.format, nodeContext.textClassName]);

		const content = useMemo(
			() => renderTextWithEmojiPlaceholders(node.text, styleClassName),
			[node.text, styleClassName],
		);

		return (
			<RNText className={styleClassName} selectable>
				{content}
			</RNText>
		);
	},
);
