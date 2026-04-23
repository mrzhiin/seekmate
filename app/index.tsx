import "../global.css";
import { ReanimatedTrueSheetProvider } from "@lodev09/react-native-true-sheet/reanimated";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { DropProvider } from "react-native-reanimated-dnd";
import { Sentry } from "@/lib/sentry";
import { RootStack } from "@/stack/rootStack";
import { CategoriesProvider } from "@/state/categories";
import { LocalizationProvider } from "@/state/localization";
import { NavigationProvider } from "@/state/navigation";
import { QueryProvider } from "@/state/query";
import { ThemeProvider } from "@/state/theme";
import { WebServiceProvider } from "@/state/web";

export const App = Sentry.wrap(() => {
	return (
		<GestureHandlerRootView>
			<DropProvider>
				<KeyboardProvider>
					<ReanimatedTrueSheetProvider>
						<LocalizationProvider>
							<ThemeProvider>
								<QueryProvider>
									<CategoriesProvider />
									<WebServiceProvider>
										{/* TODO: Bug? */}
										<View
											style={{
												display: "none",
											}}
										/>
										<NavigationProvider>
											<RootStack />
										</NavigationProvider>
									</WebServiceProvider>
								</QueryProvider>
							</ThemeProvider>
						</LocalizationProvider>
					</ReanimatedTrueSheetProvider>
				</KeyboardProvider>
			</DropProvider>
		</GestureHandlerRootView>
	);
});
