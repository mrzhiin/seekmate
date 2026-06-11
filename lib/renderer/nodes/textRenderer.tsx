import { TEXT_TYPE_TO_FORMAT, type TextFormatType } from "lexical";
import { memo, type ReactNode, useContext, useMemo } from "react";
import { Text as RNText } from "react-native";
import { NodeContext } from "../context";
import type { ExtractFromPredicate, isTextNode } from "../types";
import { EmojiText } from "./emojiText";

const FormatTextTypeMap = new Map<number, TextFormatType | string>(
	Object.entries(TEXT_TYPE_TO_FORMAT).map(([key, value]) => {
		return [value, key];
	}),
);

const EMOJI_TOKEN_REGEXP = /:(?:ac|yct|xhj|emoji)\d+:/g;
const HAS_EMOJI_TOKEN_REGEXP = /:(?:ac|yct|xhj|emoji)\d+:/;

const renderTextWithEmojiPlaceholders = (text: string, className?: string) => {
	if (!HAS_EMOJI_TOKEN_REGEXP.test(text)) return text;

	EMOJI_TOKEN_REGEXP.lastIndex = 0;

	const parts: ReactNode[] = [];
	let lastIndex = 0;
	let match = EMOJI_TOKEN_REGEXP.exec(text);

	while (match !== null) {
		const token = match[0];
		const index = match.index;

		if (index > lastIndex) {
			parts.push(text.slice(lastIndex, index));
		}

		parts.push(
			<EmojiText
				key={`${token}-${index}`}
				token={token}
				className={className}
			/>,
		);
		lastIndex = index + token.length;
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
			const textType = FormatTextTypeMap.get(node.format);
			let className = "";

			switch (textType) {
				case "code":
					className = "text-slate-300 bg-slate-600";
					break;
				case "bold":
					className = "font-bold";
					break;
				case "underline":
					className = "underline";
					break;
				case "italic":
					className = "italic";
					break;
				case "highlight":
					className = "text-primary-foreground bg-primary";
					break;
				case "strikethrough":
					className = "line-through";
					break;
				case "subscript":
					className = "text-xs align-baseline";
					break;
				case "superscript":
					className = "text-xs align-super";
					break;
				case "lowercase":
					className = "lowercase";
					break;
				case "uppercase":
					className = "uppercase";
					break;
				case "capitalize":
					className = "capitalize";
					break;
				default:
					break;
			}

			return `${nodeContext.textClassName} ${className}`;
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
