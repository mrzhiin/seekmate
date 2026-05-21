import { memo, useEffect, useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Pressable } from "@/components/pressable";
import { Text } from "@/components/ui/text";
import { useRenderNodeChildren } from "../node";
import type { ExtractFromPredicate, isTabsNode } from "../types";

export const TabsRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isTabsNode> }) => {
		const [activeTabIndex, setActiveTabIndex] = useState(0);

		useEffect(() => {
			setActiveTabIndex((current) => {
				if (node.tabs.length === 0) return 0;
				return Math.min(current, node.tabs.length - 1);
			});
		}, [node.tabs]);

		const activeTab = node.tabs[activeTabIndex] ?? node.tabs[0];
		const activeTabChildren = useRenderNodeChildren(activeTab?.children ?? []);

		if (!activeTab) {
			return null;
		}

		return (
			<View>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-row gap-2">
						{node.tabs.map((tab, index) => {
							const isActive = index === activeTabIndex;
							const label = tab.title?.trim() || `Tab ${index + 1}`;
							const tabKey = `${label}-${tab.children.length}-${tab.children[0]?.type ?? "empty"}`;

							return (
								<Pressable
									key={tabKey}
									onPress={() => setActiveTabIndex(index)}
									accessibilityRole="tab"
									accessibilityState={{ selected: isActive }}
									className={`rounded-full px-2.5 py-2 ${
										isActive ? "bg-primary" : "bg-muted"
									}`}
								>
									<Text
										className={`text-xs ${
											isActive
												? "text-primary-foreground"
												: "text-muted-foreground"
										}`}
										numberOfLines={1}
									>
										{label}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</ScrollView>
				<View>{activeTabChildren}</View>
			</View>
		);
	},
);
