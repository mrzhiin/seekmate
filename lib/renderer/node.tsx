import { File } from "expo-file-system";
import { startActivityAsync } from "expo-intent-launcher";
import * as Linking from "expo-linking";
import {
	type SerializedLexicalNode,
	TEXT_TYPE_TO_FORMAT,
	type TextFormatType,
	TextNode,
} from "lexical";
import { memo, useCallback, useContext, useMemo, useRef } from "react";
import { Text as RNText, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { NitroImage, useImage } from "react-native-nitro-image";
import * as v from "valibot";
import { ErrorFallback } from "@/components/errorFallback";
import { Spinner } from "@/components/spinner";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { config } from "../config";
import { NodeContext } from "./context";
import {
	type ExtractFromPredicate,
	isCodeNode,
	isHeadingNode,
	isImageNode,
	isLineBreakNode,
	isLinkNode,
	isListItemNode,
	isListNode,
	isParagraphNode,
	isQuoteNode,
	isRootNode,
	isTextNode,
} from "./types";

const FormatTextTypeMap = new Map<number, TextFormatType | string>(
	Object.entries(TEXT_TYPE_TO_FORMAT).map(([key, value]) => {
		return [value, key];
	}),
);

type TextGroup = (
	| ExtractFromPredicate<isTextNode>
	| ExtractFromPredicate<isLinkNode>
	| ExtractFromPredicate<isLineBreakNode>
)[];

const groupConsecutiveTextNodes = (
	children: SerializedLexicalNode[],
): (SerializedLexicalNode | TextGroup)[] => {
	const result: (SerializedLexicalNode | TextGroup)[] = [];
	let textGroup: TextGroup = [];

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const isText =
			isTextNode(child) || isLinkNode(child) || isLineBreakNode(child);

		if (isText) {
			textGroup.push(child);
		} else {
			if (textGroup.length > 0) {
				result.push(textGroup);
				textGroup = [];
			}
			result.push(child);
		}
	}

	if (textGroup.length > 0) {
		result.push(textGroup);
	}

	return result;
};

export const useRenderNodeChildren = (children: SerializedLexicalNode[]) => {
	return useMemo(() => {
		if (!children) return null;

		const groups = groupConsecutiveTextNodes(children);

		return groups.map((group, index) => {
			const key = index;

			if (Array.isArray(group)) {
				if (group.length === 0) return null;

				if (group.length === 1) {
					return <NodeRenderer key={key} node={group[0]} />;
				}

				return <TextsRenderer key={key} nodes={group} />;
			}
			return <NodeRenderer key={key} node={group} />;
		});
	}, [children]);
};

export const NodeRenderer = ({ node }: { node: SerializedLexicalNode }) => {
	if (isRootNode(node)) {
		return <RootRenderer node={node} />;
	}
	if (isParagraphNode(node)) {
		return <ParagraphRenderer node={node} />;
	}
	if (isHeadingNode(node)) {
		return <HeadingRenderer node={node} />;
	}
	if (isTextNode(node)) {
		return <TextRenderer node={node} />;
	}
	if (isLinkNode(node)) {
		return <LinkRenderer node={node} />;
	}
	if (isListNode(node)) {
		return <ListRenderer node={node} />;
	}
	if (isListItemNode(node)) {
		return <ListItemRenderer node={node} />;
	}
	if (isLineBreakNode(node)) {
		return <LineBreakRenderer />;
	}
	if (isQuoteNode(node)) {
		return <QuoteRenderer node={node} />;
	}
	if (isImageNode(node)) {
		return <ImageRenderer node={node} />;
	}
	if (isCodeNode(node)) {
		return <CodeRenderer node={node} />;
	}
	return null;
};

const RootRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isRootNode> }) => {
		return useRenderNodeChildren(node.children);
	},
);

const ParagraphRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isParagraphNode> }) => {
		return <View className="py-2">{useRenderNodeChildren(node.children)}</View>;
	},
);

export const HeadingRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isHeadingNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(() => {
			let c = "";

			switch (node.tag) {
				case "h1":
					c = "text-4xl";
					break;
				case "h2":
					c = "text-2xl";
					break;
				case "h3":
					c = "text-xl";
					break;
				case "h4":
					c = "text-lg";
					break;
				default:
					break;
			}

			return {
				...nodeContext,
				textClassName: `${nodeContext.textClassName} ${c}`.trim(),
			};
		}, [nodeContext, node.tag]);

		return (
			<NodeContext.Provider value={value}>
				<RNText className="my-2 pl-2 border-l-2 border-primary" selectable>
					{useRenderNodeChildren(node.children)}
				</RNText>
			</NodeContext.Provider>
		);
	},
);

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

		return (
			<RNText className={styleClassName} selectable>
				{node.text}
			</RNText>
		);
	},
);

export const TextsRenderer = memo(({ nodes }: { nodes: TextGroup }) => {
	return (
		<RNText selectable>
			{nodes.map((node, index) => {
				const key = `${index}`;
				return <NodeRenderer key={key} node={node} />;
			})}
		</RNText>
	);
});

const LinkRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isLinkNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(
			() => ({
				...nodeContext,
				textClassName: `${nodeContext.textClassName} text-primary`,
			}),
			[nodeContext],
		);

		const onPress = useCallback(() => {
			const r = v.safeParse(
				v.pipe(v.string(), v.nonEmpty(), v.url()),
				node.url,
			);

			let url: string;

			if (r.success) {
				url = node.url;
			} else {
				url = new URL(node.url, config.apiBaseUrl).toString();
			}

			Linking.openURL(url);
		}, [node.url]);

		return (
			<NodeContext.Provider value={value}>
				<RNText onPress={onPress} selectable>
					{useRenderNodeChildren(node.children)}
				</RNText>
			</NodeContext.Provider>
		);
	},
);

const ListRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isListNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(
			() => ({
				...nodeContext,
				listType: node.listType,
			}),
			[nodeContext, node.listType],
		);

		return (
			<NodeContext.Provider value={value}>
				<View className="gap-2">{useRenderNodeChildren(node.children)}</View>
			</NodeContext.Provider>
		);
	},
);

const ListItemRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isListItemNode> }) => {
		const nodeContext = useContext(NodeContext);

		return (
			<View className="flex-row gap-2 pl-4">
				{node.children[0]?.type === TextNode.getType() ? (
					<RNText className={`${nodeContext.textClassName}`} selectable>
						{nodeContext.listType === "bullet" ? (
							<MaterialDesignIcons name="circle-medium" size={14} />
						) : (
							`${node.value}.`
						)}
					</RNText>
				) : null}
				<View className="flex-1">{useRenderNodeChildren(node.children)}</View>
			</View>
		);
	},
);

const LineBreakRenderer = memo(() => {
	return <RNText selectable>{"\n"}</RNText>;
});

const QuoteRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isQuoteNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(
			() => ({
				...nodeContext,
				textClassName: `${nodeContext.textClassName} text-muted-foreground`,
			}),
			[nodeContext],
		);

		return (
			<NodeContext.Provider value={value}>
				<View className="my-2 p-2 rounded-xl bg-muted gap-0.5">
					<View>
						<MaterialDesignIcons
							name="format-quote-open"
							size={16}
							className="text-muted-foreground"
						/>
					</View>
					{useRenderNodeChildren(node.children)}
					<View className="items-end">
						<MaterialDesignIcons
							name="format-quote-close"
							size={16}
							className="text-muted-foreground"
						/>
					</View>
				</View>
			</NodeContext.Provider>
		);
	},
);

const ImageRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isImageNode> }) => {
		const isSavingRef = useRef(false);
		const src = useMemo(() => {
			const result = v.safeParse(
				v.pipe(v.string(), v.nonEmpty(), v.url()),
				node.src,
			);
			if (result.success) {
				return node.src;
			}
			return new URL(node.src, config.siteUrl).toString();
		}, [node.src]);

		const { image, error } = useImage({
			url: src,
		});

		if (error) {
			return <ErrorFallback />;
		}

		if (image) {
			const aspect = (image?.width ?? 1) / (image?.height ?? 1);
			return (
				<Pressable
					onLongPress={async () => {
						try {
							isSavingRef.current = true;

							const path = await image.saveToTemporaryFileAsync("png");
							const file = new File(`file://${path}`);

							if (file.exists && file.contentUri) {
								await startActivityAsync("android.intent.action.VIEW", {
									data: file.contentUri,
									flags: 1,
									type: "image/png",
								});
							}
						} finally {
							isSavingRef.current = false;
						}
					}}
				>
					<NitroImage
						image={image}
						style={{
							width: "100%",
							maxWidth: image.width,
							aspectRatio: aspect,
						}}
					/>
				</Pressable>
			);
		}

		return <Spinner />;
	},
);

const CodeRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isQuoteNode> }) => {
		const nodeContext = useContext(NodeContext);
		const value = useMemo(
			() => ({
				...nodeContext,
				textClassName: `${nodeContext.textClassName} text-slate-300`,
			}),
			[nodeContext],
		);

		return (
			<NodeContext.Provider value={value}>
				<RNText className="my-2 p-2 rounded-xl bg-slate-600" selectable>
					{useRenderNodeChildren(node.children)}
				</RNText>
			</NodeContext.Provider>
		);
	},
);
