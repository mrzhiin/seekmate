import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ScreenName } from "@/stack/screenName";
import type { ScreenParams } from "@/stack/screenParams";

export interface Params {
	id: number;
}

type Props = NativeStackScreenProps<ScreenParams, typeof ScreenName.User>;

const Screen = ({ route }: Props) => {
	const _id = route.params?.id;
};

export default Screen;
