import type { LexicalEditor, NodeKey } from "lexical";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Content = (props: { editor: LexicalEditor }) => {
	const { editor } = props;
	const [decorators, setDecorators] = useState<Record<NodeKey, ReactNode>>({});
	const elRef = useRef<HTMLDivElement>(null);

	const decoratedPortals = useMemo(() => {
		if (editor) {
			const decoratedPortals = [];
			const decoratorKeys = Object.keys(decorators);

			for (const nodeKey of decoratorKeys) {
				const element = editor.getElementByKey(nodeKey);
				const node = decorators[nodeKey];

				if (element) {
					decoratedPortals.push(createPortal(node, element, nodeKey));
				}
			}

			return decoratedPortals;
		}
	}, [decorators, editor]);

	useEffect(() => {
		return editor.registerDecoratorListener<ReactNode>((nextDecorators) => {
			setDecorators(nextDecorators);
		});
	}, [editor]);

	useEffect(() => {
		const el = elRef.current;
		if (el) {
			editor.setRootElement(el);
			return () => {
				editor.setRootElement(null);
			};
		}
	}, [editor]);

	return (
		<>
			<div
				ref={elRef}
				contentEditable
				style={{
					flex: 1,
					outline: "none",
				}}
			/>
			{decoratedPortals}
		</>
	);
};

export default Content;
