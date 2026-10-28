import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
	type ComponentRef,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, type TextInput, View } from "react-native";
import { useMMKVObject } from "react-native-mmkv";
import { twMerge } from "tailwind-merge";
import { PostListView } from "@/components/post/postList";
import { Pressable } from "@/components/pressable";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { SearchBar } from "@/components/ui/searchBar";
import { Text } from "@/components/ui/text";
import { useSearchInfinitePostsQuery } from "@/hooks/services/useInfinitePostsQuery";
import { StorageKey } from "@/lib/storage";
import type { ScreenParams } from "@/stack/screenParams";

const Screen = () => {
	const navigation = useNavigation<NativeStackNavigationProp<ScreenParams>>();
	const { t } = useTranslation();
	const searchBarRef = useRef<ComponentRef<typeof TextInput>>(null);
	const [keyword, setKeyword] = useState("");
	const [keywords, setKeywords] = useMMKVObject<string[]>(
		StorageKey.SearchKeywords,
	);

	const query = useSearchInfinitePostsQuery({
		keyword,
	});

	const handleSearch = useCallback(
		(keyword: string) => {
			setKeyword(keyword);
			setKeywords((previous) =>
				[keyword, ...(previous ?? []).filter((item) => item !== keyword)].slice(
					0,
					10,
				),
			);
		},
		[setKeywords],
	);

	useEffect(() => {
		navigation.setOptions({
			headerTitle: () => {
				return (
					<SearchBar
						ref={searchBarRef}
						placeholder={t("search.placeholder")}
						onSubmitEditing={(e) => {
							handleSearch(e);
						}}
					/>
				);
			},
		});
	}, [navigation, handleSearch, t]);

	useEffect(() => {
		const unsubscribe = navigation.addListener("transitionStart", (e) => {
			if (!e.data.closing && !keyword) {
				searchBarRef.current?.focus();
			}
		});

		return unsubscribe;
	}, [navigation, keyword]);

	return (
		<>
			{Array.isArray(keywords) && keywords.length ? (
				<View className="gap-2 py-4">
					<View className="flex-row items-center justify-between px-4">
						<Text className="text-sm font-semibold">{t("search.recent")}</Text>
						<View className="flex-row items-center gap-1">
							<MaterialDesignIcons
								name="information-outline"
								size={14}
								className="text-secondary-foreground"
							/>
							<Text className="text-xs text-secondary-foreground">
								{t("search.longPressToRemove")}
							</Text>
						</View>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
					>
						{keywords.map((x, index) => {
							return (
								<View
									key={x}
									className={twMerge(
										"overflow-hidden rounded-full bg-secondary",
										keyword === x && "bg-accent",
									)}
								>
									<Pressable
										accessibilityRole="button"
										accessibilityLabel={x}
										accessibilityHint={t("search.longPressToRemove")}
										accessibilityState={{ selected: keyword === x }}
										className="min-h-10 flex-row items-center gap-2 px-4"
										onPress={() => {
											handleSearch(x);
											searchBarRef.current?.setNativeProps({ text: x });
										}}
										onLongPress={() => {
											setKeywords((p) => {
												if (Array.isArray(p)) {
													return p.toSpliced(index, 1);
												}
											});
										}}
									>
										<MaterialDesignIcons
											name="history"
											size={16}
											className={
												keyword === x
													? "text-accent-foreground"
													: "text-secondary-foreground"
											}
										/>
										<Text
											className={
												keyword === x ? "text-accent-foreground" : undefined
											}
										>
											{x}
										</Text>
									</Pressable>
								</View>
							);
						})}
					</ScrollView>
				</View>
			) : null}
			{keyword ? (
				<PostListView query={query} />
			) : (
				<View className="flex-1 justify-center items-center">
					<MaterialDesignIcons
						name="text-search"
						className="text-secondary-foreground"
						size={48}
					/>
				</View>
			)}
		</>
	);
};

export default Screen;
