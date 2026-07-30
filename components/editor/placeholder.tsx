import { $canShowPlaceholderCurry } from "@lexical/text";
import { type LexicalEditor, mergeRegister } from "lexical";
import { useLayoutEffect, useState } from "react";

function canShowPlaceholderFromCurrentEditorState(
	editor: LexicalEditor,
): boolean {
	const currentCanShowPlaceholder = editor
		.getEditorState()
		.read($canShowPlaceholderCurry(editor.isComposing()));

	return currentCanShowPlaceholder;
}

function useCanShowPlaceholder(editor: LexicalEditor): boolean {
	const [canShowPlaceholder, setCanShowPlaceholder] = useState(() =>
		canShowPlaceholderFromCurrentEditorState(editor),
	);

	useLayoutEffect(() => {
		function resetCanShowPlaceholder() {
			const currentCanShowPlaceholder =
				canShowPlaceholderFromCurrentEditorState(editor);
			setCanShowPlaceholder(currentCanShowPlaceholder);
		}
		resetCanShowPlaceholder();
		return mergeRegister(
			editor.registerUpdateListener(() => {
				resetCanShowPlaceholder();
			}),
			editor.registerEditableListener(() => {
				resetCanShowPlaceholder();
			}),
		);
	}, [editor]);

	return canShowPlaceholder;
}

export function Placeholder({
	editor,
	placeholder,
}: {
	editor: LexicalEditor;
	placeholder?: string;
}): null | React.ReactNode {
	const showPlaceholder = useCanShowPlaceholder(editor);

	if (!showPlaceholder) {
		return null;
	}

	return (
		<p
			style={{
				position: "absolute",
				left: 0,
				top: 0,
				pointerEvents: "none",
				userSelect: "none",
			}}
			className="text-muted-foreground my-3"
		>
			{placeholder}
		</p>
	);
}
