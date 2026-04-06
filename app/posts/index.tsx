import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { PostList } from "@/components/post/postList";
import { useCategoriesQuery } from "@/hooks/services/useCategoriesQuery";
import type { ScreenName } from "@/stack/screenName";
import type { ScreenParams } from "@/stack/screenParams";

export type Params = {
	category: string;
};

type Props = NativeStackScreenProps<ScreenParams, typeof ScreenName.Posts>;

const Screen = (props: Props) => {
	const category = props.route.params.category;
	const navigation = useNavigation();
	const { data } = useCategoriesQuery();

	useEffect(() => {
		const c = data?.find((x) => x.slug === category);

		navigation.setOptions({
			title: c?.nameZh || category,
		});
	}, [navigation, category, data]);

	if (!category) {
		return null;
	}

	return <PostList category={category} />;
};

export default Screen;
