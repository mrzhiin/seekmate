import { Suspense } from "react";
import { View } from "react-native";
import { ErrorBoundary } from "../errorBoundary";
import { Spinner } from "../spinner";
import { CategoriesView } from "./categoriesView";

export const CategoriesResolver = () => {
	return (
		<ErrorBoundary>
			<Suspense
				fallback={
					<View className="flex-1 justify-center items-center">
						<Spinner />
					</View>
				}
			>
				<CategoriesView />
			</Suspense>
		</ErrorBoundary>
	);
};
