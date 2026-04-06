import { Text } from "@/components/ui/text";

export const Label = ({ text }: { text?: string }) => {
	return <Text className="text-base px-6 py-2">{text}</Text>;
};
