"use dom";

import "@/global.css";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import {
	$isListNode,
	INSERT_UNORDERED_LIST_COMMAND,
	ListItemNode,
	ListNode,
	REMOVE_LIST_COMMAND,
	registerList,
} from "@lexical/list";
import {
	$createHeadingNode,
	HeadingNode,
	QuoteNode,
	registerRichText,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $rootTextContent } from "@lexical/text";
import { $findMatchingParent } from "@lexical/utils";
import { type DOMImperativeFactory, useDOMImperativeHandle } from "expo/dom";
import {
	$createParagraphNode,
	$getRoot,
	$getSelection,
	$isDecoratorNode,
	$isRangeSelection,
	createEditor,
	FORMAT_TEXT_COMMAND,
	LineBreakNode,
	mergeRegister,
	REDO_COMMAND,
	RootNode,
	TextNode,
	UNDO_COMMAND,
} from "lexical";
import { type Ref, useEffect, useRef, useState } from "react";
import Content from "./content";
import { EditorContext } from "./context";
import { $createImageNode, ImageNode } from "./nodes/ImageNode";
import { Placeholder } from "./placeholder";

export type SerializedNode = {
	type: "image";
	src: string;
	altText: string;
};
export type HeadingLevel = "h1" | "h2" | "h3";
type DOMImperativeArgs = Parameters<DOMImperativeFactory[string]>;

export interface EditorRef extends DOMImperativeFactory {
	setValue: (e: unknown) => void;
	setHeading: {
		(level: HeadingLevel): void;
		(...args: DOMImperativeArgs): void;
	};
	setParagraph: () => void;
	undo: () => void;
	redo: () => void;
	toggleBold: () => void;
	toggleItalic: () => void;
	toggleBulletedList: () => void;
	insertNodes: {
		(nodes: SerializedNode[]): void;
		(...args: DOMImperativeArgs): void;
	};
}

interface Props {
	onChange?: (e: string) => void;
	onSummaryChange?: (e: string) => void;
	onReady?: () => void;
	placeholder?: string;
	ref: Ref<EditorRef>;
	dom?: import("expo/dom").DOMProps;
}

const Editor = ({
	ref,
	onChange,
	onSummaryChange,
	onReady,
	placeholder = "",
}: Props) => {
	const contentAreaRef = useRef<HTMLDivElement>(null);

	const [editor] = useState(() => {
		const config = {
			namespace: "MyEditor",
			theme: {
				paragraph: "my-3",
				heading: {
					h1: "text-3xl",
					h2: "text-2xl",
					h3: "text-xl",
					h4: "text-lg",
				},
				quote: "border-l-4 border-border pl-4 italic text-muted-foreground",
				list: {
					nested: {
						listitem: "list-none",
					},
					ol: "list-decimal ml-4",
					ul: "list-disc ml-4",
					listitem: "my-1",
				},
			},
			nodes: [
				HeadingNode,
				LineBreakNode,
				QuoteNode,
				TextNode,
				ListNode,
				ListItemNode,
				ImageNode,
			],
			onError: console.error,
		};

		return createEditor(config);
	});

	useEffect(() => {
		const contentArea = contentAreaRef.current;

		if (!contentArea) {
			return;
		}

		const focusEditor = (event: MouseEvent) => {
			if (event.target === contentArea) {
				editor.focus();
			}
		};

		contentArea.addEventListener("click", focusEditor);
		return () => {
			contentArea.removeEventListener("click", focusEditor);
		};
	}, [editor]);

	useEffect(() => {
		editor.update(() => {
			const root = $getRoot();

			if (root.isEmpty()) {
				const paragraph = $createParagraphNode();
				root.append(paragraph);
				const activeElement = document.activeElement;
				if (
					$getSelection() !== null ||
					(activeElement !== null && activeElement === editor.getRootElement())
				) {
					paragraph.select();
				}
			}
		});
	}, [editor]);

	useEffect(() => {
		const historyState = createEmptyHistoryState();

		return mergeRegister(
			registerRichText(editor),
			registerList(editor),
			registerHistory(editor, historyState, 1000),
			editor.registerNodeTransform(RootNode, (root) => {
				const lastChild = root.getLastChild();
				if ($isDecoratorNode(lastChild) && !lastChild.isInline()) {
					root.append($createParagraphNode());
				}
			}),
		);
	}, [editor]);

	useEffect(() => {
		return editor.registerTextContentListener(() => {
			if (onChange) {
				onChange(JSON.stringify(editor.getEditorState().toJSON()));
			}

			if (onSummaryChange) {
				let rootTextContent = "";

				editor.read(() => {
					rootTextContent = $rootTextContent();
				});

				onSummaryChange(rootTextContent.slice(0, 140));
			}
		});
	}, [editor, onChange, onSummaryChange]);

	useDOMImperativeHandle(ref, () => {
		const focusEditor = () => editor.focus();
		const setBlock = (createNode: Parameters<typeof $setBlocksType>[1]) => {
			focusEditor();
			editor.update(() => {
				$setBlocksType($getSelection(), createNode);
			});
		};

		return {
			setValue: (value) => {
				const parsedEditorState = editor.parseEditorState(
					typeof value === "string" ? value : "",
				);
				editor.setEditorState(parsedEditorState);
			},
			insertNodes: ((nodes: SerializedNode[]) => {
				editor.update(() => {
					const _nodes = nodes
						.map((node) => {
							if (node.type === "image") {
								return $createImageNode({
									src: node.src,
									altText: node.altText,
								});
							} else {
								return null;
							}
						})
						.filter((x) => x !== null);

					if (!_nodes.length) return;

					const selection = $getSelection();

					if ($isRangeSelection(selection)) {
						selection.insertNodes(_nodes);
					} else {
						$getRoot().append(..._nodes);
					}
				});
			}) as EditorRef["insertNodes"],
			setHeading: (...[level]: DOMImperativeArgs) => {
				if (level === "h1" || level === "h2" || level === "h3") {
					setBlock(() => $createHeadingNode(level));
				}
			},
			setParagraph: () => setBlock(() => $createParagraphNode()),
			undo: () => {
				focusEditor();
				editor.dispatchCommand(UNDO_COMMAND, undefined);
			},
			redo: () => {
				focusEditor();
				editor.dispatchCommand(REDO_COMMAND, undefined);
			},
			toggleBold: () => {
				focusEditor();
				editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
			},
			toggleItalic: () => {
				focusEditor();
				editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
			},
			toggleBulletedList: () => {
				focusEditor();
				const selectionIsInBulletList = editor.getEditorState().read(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return false;
					return $isListNode(
						$findMatchingParent(selection.anchor.getNode(), $isListNode),
					);
				});
				editor.dispatchCommand(
					selectionIsInBulletList
						? REMOVE_LIST_COMMAND
						: INSERT_UNORDERED_LIST_COMMAND,
					undefined,
				);
			},
		};
	}, [editor]);

	useEffect(() => {
		if (editor) {
			onReady?.();
		}
	}, [editor, onReady]);

	return (
		<EditorContext
			value={{
				editor,
			}}
		>
			<div
				ref={contentAreaRef}
				className="flex flex-col flex-1 relative text-sans text-sm font-medium text-foreground"
				style={{
					minHeight: "100dvh",
				}}
			>
				<Content editor={editor} />
				<Placeholder editor={editor} placeholder={placeholder} />
			</div>
		</EditorContext>
	);
};

export default Editor;
