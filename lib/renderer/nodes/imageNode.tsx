import type {
	DOMConversionMap,
	DOMConversionOutput,
	LexicalNode,
	LexicalUpdateJSON,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import type { JSX } from "react";

interface ImageNodeProperty {
	altText: string;
	src: string;
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
	if (!(domNode instanceof HTMLImageElement)) {
		return null;
	}

	const src = domNode.getAttribute("src");

	if (!src || src.startsWith("file:///")) {
		return null;
	}

	const node = $createImageNode({ altText: domNode.alt, src });
	return { node };
}

export type SerializedImageNode = Spread<
	ImageNodeProperty,
	SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
	__altText: string;
	__src: string;

	constructor(src: string, altText: string, key?: NodeKey) {
		super(key);
		this.__src = src;
		this.__altText = altText;
	}

	static getType(): string {
		return "image";
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__src, node.__altText, node.__key);
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		const { altText, src } = serializedNode;

		return $createImageNode({
			altText,
			src,
		}).updateFromJSON(serializedNode);
	}

	static importDOM(): DOMConversionMap | null {
		return {
			img: () => ({
				conversion: $convertImageElement,
				priority: 0,
			}),
		};
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this {
		return super.updateFromJSON(serializedNode) as this;
	}

	exportJSON(): SerializedImageNode {
		return {
			...super.exportJSON(),
			altText: this.getAltText(),
			src: this.getSrc(),
		};
	}

	getSrc(): string {
		return this.getLatest().__src;
	}

	getAltText(): string {
		return this.getLatest().__altText;
	}

	// decorate(): JSX.Element {
	// 	return <img src={this.getSrc()} alt={this.getAltText()} />;
	// }
}

export function $createImageNode({
	altText,
	src,
}: ImageNodeProperty): ImageNode {
	return $applyNodeReplacement(new ImageNode(src, altText));
}

export function $isImageNode(
	node: LexicalNode | null | undefined,
): node is ImageNode {
	return node instanceof ImageNode;
}
