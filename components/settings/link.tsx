import { Linking } from "react-native";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
import { Item, type ItemProps } from "./Item";

export const Link = ({
	label,
	subLabel,
	uri,
}: Pick<ItemProps, "label" | "subLabel"> & {
	uri: string;
}) => {
	return (
		<Item
			label={label}
			subLabel={subLabel}
			right={
				<MaterialDesignIcons
					name="open-in-new"
					size={24}
					className="text-secondary-foreground mr-3"
				/>
			}
			onPress={() => {
				Linking.openURL(uri);
			}}
		/>
	);
};
