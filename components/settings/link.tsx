import { Linking } from "react-native";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
import { Item, type ItemProps } from "./Item";

export const Link = ({
	icon,
	label,
	subLabel,
	uri,
}: Pick<ItemProps, "icon" | "label" | "subLabel"> & {
	uri: string;
}) => {
	return (
		<Item
			icon={icon}
			label={label}
			subLabel={subLabel}
			right={
				<MaterialDesignIcons
					name="open-in-new"
					size={24}
					className="text-secondary-foreground"
				/>
			}
			onPress={() => {
				Linking.openURL(uri);
			}}
		/>
	);
};
