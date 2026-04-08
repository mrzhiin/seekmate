import { type Ref, Suspense } from "react";
import { View } from "react-native";
import { ErrorBoundary } from "../errorBoundary";
import { Spinner } from "../spinner";
import { MineView, type MineViewRef } from "./mineView";

export const MineResolver = ({
	uid,
	ref,
}: {
	uid: number;
	ref?: Ref<MineViewRef>;
}) => {
	return (
		<ErrorBoundary>
			<Suspense
				fallback={
					<View className="flex-1 justify-center items-center">
						<Spinner />
					</View>
				}
			>
				<MineView ref={ref} uid={uid} />
			</Suspense>
		</ErrorBoundary>
	);
};
