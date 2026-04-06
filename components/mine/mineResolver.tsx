import { Suspense } from "react";
import { View } from "react-native";
import { ErrorBoundary } from "../errorBoundary";
import { Spinner } from "../spinner";
import { MineView } from "./mineView";

export const MineResolver = ({ uid }: { uid: number }) => {
	return (
		<ErrorBoundary>
			<Suspense
				fallback={
					<View className="flex-1 justify-center items-center">
						<Spinner />
					</View>
				}
			>
				<MineView uid={uid} />
			</Suspense>
		</ErrorBoundary>
	);
};
