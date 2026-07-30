import type { LexicalEditor } from "lexical";
import { createContext } from "react";

export const EditorContext = createContext<{
	editor?: LexicalEditor | null;
}>({
	editor: null,
});
