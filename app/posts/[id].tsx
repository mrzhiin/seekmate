import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { View } from "react-native";
import { ErrorFallback } from "@/components/errorFallback";
import { PostView } from "@/components/post/postView";
import { Spinner } from "@/components/spinner";
import { usePostOriginalQuery } from "@/hooks/services/usePostOriginalQuery";
import type { ScreenName } from "@/stack/screenName";
import type { ScreenParams } from "@/stack/screenParams";

export type Params = {
	id: number;
};

type Props = NativeStackScreenProps<ScreenParams, typeof ScreenName.Post>;

const Screen = (props: Props) => {
	const id = props.route.params.id;
	const navigation = useNavigation();
	const {
		data: postData,
		isLoading,
		isError,
		refetch,
	} = usePostOriginalQuery({
		postId: id,
	});

	useEffect(() => {
		navigation.setOptions({
			title: "",
		});
	}, [navigation]);

	if (isLoading) {
		return (
			<View className="flex-1 justify-center items-center">
				<Spinner />
			</View>
		);
	}

	if (isError) {
		return <ErrorFallback onReset={refetch} />;
	}

	if (postData) {
		return <PostView postData={postData} id={id} />;
	}
};

export default Screen;
