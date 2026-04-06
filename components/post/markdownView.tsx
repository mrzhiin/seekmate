import { useSuspenseQuery } from "@tanstack/react-query";
import { MarkdownText } from "./markdownText";

export const MarkdownView = ({
	html,
	textSize,
}: {
	html: string;
	textSize?: string;
}) => {
	const { data } = useSuspenseQuery({
		queryKey: [html],
		queryFn: async () => {
			return "";
		},
		retry: false,
	});

	return data && <MarkdownText markdown={data} textSize={textSize} />;
};
