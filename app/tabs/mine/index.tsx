import { Header } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView as RNScreensSafeAreaView } from "react-native-screens/experimental";
import { useStore } from "zustand";
import { MineResolver } from "@/components/mine/mineResolver";
import { Pressable } from "@/components/pressable";
import { SignInPrompt } from "@/components/signInPrompt";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { ScreenName } from "@/stack/screenName";
import { userStore } from "@/store/userStore";

const Screen = () => {
	const navigation = useNavigation();
	const uid = useStore(userStore, (s) => s.id);

	return (
		<RNScreensSafeAreaView
			edges={{
				bottom: true,
			}}
		>
			<ScrollView
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					flex: 1,
				}}
			>
				<Header
					title={uid ? "您好！" : ""}
					headerTransparent
					headerRight={() => {
						return (
							<Pressable
								className="mr-2 rounded-full justify-center items-center"
								style={{
									height: 40,
									aspectRatio: 1,
								}}
								onPress={() => {
									navigation.navigate(ScreenName.Settings);
								}}
							>
								<MaterialDesignIcons name="cog" size={24} />
							</Pressable>
						);
					}}
				/>
				{uid ? <MineResolver uid={uid} /> : <SignInPrompt />}
			</ScrollView>
		</RNScreensSafeAreaView>
	);
};

export default Screen;
