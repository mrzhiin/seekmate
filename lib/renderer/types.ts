import type { SerializedCodeNode } from "@lexical/code";
import type { SerializedLinkNode } from "@lexical/link";
import type { SerializedListItemNode, SerializedListNode } from "@lexical/list";
import type {
	SerializedHeadingNode,
	SerializedQuoteNode,
} from "@lexical/rich-text";
import type {
	SerializedLexicalNode,
	SerializedParagraphNode,
	SerializedRootNode,
	SerializedTextNode,
} from "lexical";
import type { SerializedImageNode } from "./nodes/imageNode";

export type ExtractFromPredicate<T> = T extends (node: any) => node is infer R
	? R
	: never;

export const isRootNode = (
	node: SerializedLexicalNode,
): node is SerializedRootNode => node.type === "root";
export type isRootNode = typeof isRootNode;

export const isParagraphNode = (
	node: SerializedLexicalNode,
): node is SerializedParagraphNode => node.type === "paragraph";
export type isParagraphNode = typeof isParagraphNode;

export const isHeadingNode = (
	node: SerializedLexicalNode,
): node is SerializedHeadingNode => node.type === "heading";
export type isHeadingNode = typeof isHeadingNode;

export const isTextNode = (
	node: SerializedLexicalNode,
): node is SerializedTextNode => node.type === "text";
export type isTextNode = typeof isTextNode;

export const isLinkNode = (
	node: SerializedLexicalNode,
): node is SerializedLinkNode => node.type === "link";
export type isLinkNode = typeof isLinkNode;

export const isListNode = (
	node: SerializedLexicalNode,
): node is SerializedListNode => node.type === "list";
export type isListNode = typeof isListNode;

export const isListItemNode = (
	node: SerializedLexicalNode,
): node is SerializedListItemNode => node.type === "listitem";
export type isListItemNode = typeof isListItemNode;

export const isLineBreakNode = (
	node: SerializedLexicalNode,
): node is SerializedListItemNode => node.type === "linebreak";
export type isLineBreakNode = typeof isLineBreakNode;

export const isQuoteNode = (
	node: SerializedLexicalNode,
): node is SerializedQuoteNode => node.type === "quote";
export type isQuoteNode = typeof isQuoteNode;

export const isImageNode = (
	node: SerializedLexicalNode,
): node is SerializedImageNode => node.type === "image";
export type isImageNode = typeof isImageNode;

export const isCodeNode = (
	node: SerializedLexicalNode,
): node is SerializedCodeNode => node.type === "code";
export type isCodeNode = typeof isCodeNode;
