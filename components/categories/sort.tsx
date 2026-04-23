import { generateKeyBetween } from "jittered-fractional-indexing";
import { useMemo, useState } from "react";
import { View } from "react-native";
import {
	Sortable,
	SortableItem,
	type SortableRenderItemProps,
} from "react-native-reanimated-dnd";
import { Text } from "@/components/ui/text";
import type { PinnedCategory } from "@/store/categoriesStore";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";

const ItemHeight = 56;

const sortPinnedCategoriesByPositions = (
	items: PinnedCategory[],
	allPositions?: Record<string, number>,
) => {
	if (!allPositions || Object.keys(allPositions).length !== items.length) {
		return items;
	}

	const hasMissingPosition = items.some((item) => {
		return typeof allPositions[item.slug] !== "number";
	});

	if (hasMissingPosition) {
		return items;
	}

	const nextItems = [...items].sort((a, b) => {
		return allPositions[a.slug] - allPositions[b.slug];
	});

	const unchanged = nextItems.every((item, index) => {
		return item.slug === items[index]?.slug;
	});

	if (unchanged) {
		return items;
	}

	let previousSort: string | null = null;

	return nextItems.map((item) => {
		const sort = generateKeyBetween(previousSort, null);
		previousSort = sort;

		return {
			...item,
			sort,
		};
	});
};

type Props = {
	items: PinnedCategory[];
	onChange: (items: PinnedCategory[]) => void;
};

export const Sort = ({ items, onChange }: Props) => {
	const [containerHeight, setContainerHeight] = useState(0);

	const sortableData = useMemo(() => {
		return items.map((item) => ({
			...item,
			id: item.slug,
		}));
	}, [items]);

	const renderTask = (
		props: SortableRenderItemProps<(typeof sortableData)[number]>,
	) => {
		const { item, id, ...sortableProps } = props;

		return (
			<SortableItem
				key={id}
				id={id}
				data={item}
				containerHeight={containerHeight}
				onDrop={(_itemId, _position, allPositions) => {
					onChange(sortPinnedCategoriesByPositions(items, allPositions));
				}}
				{...sortableProps}
			>
				<View
					className="flex-row items-center px-4"
					style={{
						height: ItemHeight,
					}}
				>
					<Text className="flex-1 text-base text-secondary-foreground">
						{item.nameZh}
					</Text>
					<MaterialDesignIcons name="drag-vertical" size={24} />
				</View>
			</SortableItem>
		);
	};

	return (
		<View
			onLayout={(event) => {
				setContainerHeight(event.nativeEvent.layout.height);
			}}
			style={{
				flex: 1,
			}}
		>
			{containerHeight > 0 ? (
				<Sortable
					data={sortableData}
					renderItem={renderTask}
					itemHeight={ItemHeight}
					style={{
						flex: 1,
					}}
				/>
			) : null}
		</View>
	);
};
