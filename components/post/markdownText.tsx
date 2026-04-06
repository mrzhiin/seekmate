import { useMemo } from "react";
import {
	EnrichedMarkdownText,
	type EnrichedMarkdownTextProps,
} from "react-native-enriched-markdown";
import { useResolveClassNames } from "uniwind";
import { TextClassName } from "../ui/text";

const useMDStyle = (classNames: string) => {
	const RNStyle = useResolveClassNames(classNames);
	const MDStyle = useMemo(() => {
		const { color, fontSize, lineHeight, fontFamily } = RNStyle;

		return {
			color: typeof color === "string" ? color : undefined,
			fontSize,
			lineHeight,
			fontFamily,
		};
	}, [RNStyle]);

	return MDStyle;
};

export const MarkdownText = ({
	markdownStyle,
	textSize = "text-base",
	...props
}: EnrichedMarkdownTextProps & {
	textSize?: string;
}) => {
	const paragraphStyle = useMDStyle(`${TextClassName} ${textSize}`);
	const h1Style = useMDStyle(`${TextClassName} text-4xl`);
	const h2Style = useMDStyle(`${TextClassName} text-2xl`);
	const h3Style = useMDStyle(`${TextClassName} text-xl`);

	return (
		<EnrichedMarkdownText
			flavor="github"
			{...props}
			markdownStyle={{
				paragraph: paragraphStyle,
				h1: h1Style,
				h2: h2Style,
				h3: h3Style,
				...markdownStyle,
			}}
		/>
	);
};
