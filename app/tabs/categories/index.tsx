import { Header } from "@react-navigation/elements";
import { Suspense } from "react";
import { View } from "react-native";
import { SafeAreaView as RNScreensSafeAreaView } from "react-native-screens/experimental";
import { CategoriesView } from "@/components/categories/categoriesView";
import { ErrorBoundary } from "@/components/errorBoundary";
import { Spinner } from "@/components/spinner";

const Screen = () => {
	return (
		<RNScreensSafeAreaView
			edges={{
				bottom: true,
			}}
		>
			<Header title="板块" headerShadowVisible={false} />
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
		</RNScreensSafeAreaView>
	);
};

export default Screen;
