import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useMMKVObject } from "react-native-mmkv";
import { PostListView } from "@/components/post/postList";
import { Pressable } from "@/components/pressable";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { SearchBar } from "@/components/ui/searchBar";
import { Text } from "@/components/ui/text";
import { useSearchInfinitePostsQuery } from "@/hooks/services/useInfinitePostsQuery";
import { StorageKey } from "@/lib/storage";

const MaxKeywordSize = 10;

const Screen = () => {
	const navigation = useNavigation();
	const { t } = useTranslation();
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
			setKeywords((p) => {
				if (Array.isArray(p)) {
					const newList = [...new Set([...p.toReversed(), keyword])];

					if (newList.length >= MaxKeywordSize) {
						newList.shift();
					}

					return newList.reverse();
				} else {
					return [keyword];
				}
			});
		},
		[setKeywords],
	);

	useEffect(() => {
		navigation.setOptions({
			headerTitle: () => {
				return (
					<SearchBar
						autoFocus
						placeholder={t("search.placeholder")}
						onSubmitEditing={(e) => {
							handleSearch(e);
						}}
					/>
				);
			},
		});
	}, [navigation, handleSearch, t]);

	return (
		<>
			{Array.isArray(keywords) && keywords.length ? (
				<View
					style={{
						height: 48,
					}}
					className="flex-row items-center"
				>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{keywords.map((x, index) => {
							return (
								<Pressable
									key={x}
									className={`border border-border px-3 py-1 rounded-lg justify-center items-center mr-4 ${index === 0 ? "ml-4" : ""}`}
									onPress={() => {
										handleSearch(x);
									}}
									onLongPress={() => {
										setKeywords((p) => {
											if (Array.isArray(p)) {
												return p.toSpliced(index, 1);
											}
										});
									}}
								>
									<Text>{x}</Text>
								</Pressable>
							);
						})}
						{/* </View> */}
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
