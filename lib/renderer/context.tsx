import type { ListType } from "@lexical/list";
import { createContext } from "react";

export const NodeContext = createContext<{
	textClassName?: string;
	listType?: ListType;
}>({
	textClassName: "",
	listType: undefined,
});
