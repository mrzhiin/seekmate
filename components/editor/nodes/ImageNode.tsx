import {
	$applyNodeReplacement,
	$createNodeSelection,
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	$setSelection,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	DecoratorNode,
	type EditorConfig,
	type LexicalEditor,
	type NodeKey,
	type SerializedLexicalNode,
	type Spread,
} from "lexical";
import { type ReactNode, useEffect, useRef, useState } from "react";

export type SerializedImageNode = Spread<
	{
		type: "image";
		src: string;
		altText: string;
	},
	SerializedLexicalNode
>;

function isNodeSelected(editor: LexicalEditor, key: NodeKey): boolean {
	return editor.getEditorState().read(() => {
		const node = $getNodeByKey(key);
		return node?.isSelected() ?? false;
	});
}

export function useDecoratorNodeSelection({
	editor,
	nodeKey,
	ref,
	ignoreInteractiveTargets = false,
}: {
	editor: LexicalEditor;
	nodeKey: NodeKey;
	ref: { current: HTMLElement | null };
	ignoreInteractiveTargets?: boolean;
}) {
	const [isSelected, setIsSelected] = useState(() =>
		isNodeSelected(editor, nodeKey),
	);

	useEffect(() => {
		return editor.registerUpdateListener(() => {
			setIsSelected(isNodeSelected(editor, nodeKey));
		});
	}, [editor, nodeKey]);

	useEffect(() => {
		return editor.registerCommand<MouseEvent>(
			CLICK_COMMAND,
			(event) => {
				const target = event.target;
				const element = target instanceof HTMLElement ? target : null;
				if (
					!ref.current?.contains(target as Node) ||
					(ignoreInteractiveTargets &&
						element?.closest(
							"button, a, input, textarea, select, [role='button']",
						))
				) {
					return false;
				}

				event.preventDefault();
				editor.update(() => {
					let selection = $getSelection();
					if (!$isNodeSelection(selection) || !event.shiftKey) {
						if (!event.shiftKey) {
							selection = $createNodeSelection();
							$setSelection(selection);
						} else if (!$isNodeSelection(selection)) {
							selection = $createNodeSelection();
							$setSelection(selection);
						}
					}
					if ($isNodeSelection(selection)) {
						const selected = selection
							.getNodes()
							.some((node) => node.getKey() === nodeKey);
						if (event.shiftKey && selected) {
							selection.delete(nodeKey);
						} else {
							selection.add(nodeKey);
						}
					}
				});
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, nodeKey, ref, ignoreInteractiveTargets]);

	return isSelected;
}

function ImageDecorator(props: {
	src: string;
	altText: string;
	nodeKey: NodeKey;
	editor: LexicalEditor;
}) {
	const { src, altText, nodeKey, editor } = props;
	const ref = useRef<HTMLDivElement>(null);
	const isSelected = useDecoratorNodeSelection({ editor, nodeKey, ref });

	return (
		<div
			ref={ref}
			style={{
				outline: isSelected
					? "2px solid rgb(60, 132, 244)"
					: "2px dashed var(--color-neutral-3)",
				borderRadius: 8,
				marginTop: 16,
				marginBottom: 16,
				display: "flex",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					width: "fit-content",
					margin: "auto",
					marginTop: 16,
					marginBottom: 16,
					maxWidth: "calc(100% - 80px)",
				}}
			>
				<img
					src={src}
					alt={altText}
					style={{
						maxWidth: "100%",
					}}
				/>
			</div>
		</div>
	);
}

export class ImageNode extends DecoratorNode<ReactNode> {
	private __src: string;
	private __altText: string;

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
		return $createImageNode({
			src: serializedNode.src,
			altText: serializedNode.altText,
		});
	}

	isInline(): boolean {
		return false;
	}

	canIndent(): boolean {
		return false;
	}

	createDOM(): HTMLElement {
		return document.createElement("div");
	}

	updateDOM(): false {
		return false;
	}

	decorate(editor: LexicalEditor, _config: EditorConfig): ReactNode {
		return (
			<ImageDecorator
				src={this.getSrc()}
				altText={this.getAltText()}
				nodeKey={this.getKey()}
				editor={editor}
			/>
		);
	}

	exportJSON(): SerializedImageNode {
		return {
			type: "image",
			version: 1,
			src: this.getSrc(),
			altText: this.getAltText(),
		};
	}

	getSrc(): string {
		return this.getLatest().__src;
	}

	getAltText(): string {
		return this.getLatest().__altText;
	}
}

export function $createImageNode({
	src,
	altText,
}: {
	src: string;
	altText: string;
}): ImageNode {
	return $applyNodeReplacement(new ImageNode(src, altText));
}
