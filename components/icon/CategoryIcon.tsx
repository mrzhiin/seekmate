import MaterialDesignIcons, {
	type MaterialDesignIconsIconName,
} from "@react-native-vector-icons/material-design-icons";
import { useResolveClassNames } from "uniwind";

const CategorySlugMap = new Map<
	string,
	MaterialDesignIconsIconName | undefined
>([
	["daily", "coffee"],
	["tech", "code-greater-than-or-equal"],
	["info", "orbit"],
	["review", "chart-donut-variant"],
	["trade", "wallet"],
	["carpool", "account-group"],
	["promotion", "sale"],
	["life", "food"],
	["dev", "alpha-d-box"],
	["photo-share", "image-filter-vintage"],
	["expose", "alert-octagram"],
	["inside", "incognito-circle"],
	["sandbox", "palette"],
]);

export const CategoryIcons = ({
	slug,
	size,
	className = "text-foreground",
}: {
	slug: string;
	size?: number;
	className?: string;
}) => {
	const _ = CategorySlugMap.get(slug) || "shape-plus";
	const styles = useResolveClassNames(className);

	return <MaterialDesignIcons name={_} size={size} color={styles.color} />;
};
