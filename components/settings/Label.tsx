import { Text } from "@/components/ui/text";

export const Label = ({ text }: { text?: string }) => {
	return (
		<Text
			accessibilityRole="header"
			className="px-4 pb-1 text-sm font-semibold text-primary"
		>
			{text}
		</Text>
	);
};
