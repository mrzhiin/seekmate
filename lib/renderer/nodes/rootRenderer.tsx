import { memo } from "react";
import { useRenderNodeChildren } from "../node";
import type { ExtractFromPredicate, isRootNode } from "../types";

export const RootRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isRootNode> }) => {
		return useRenderNodeChildren(node.children);
	},
);
