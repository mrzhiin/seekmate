import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { fetch } from "expo/fetch";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, TextInput, View } from "react-native";
import {
	KeyboardGestureArea,
	KeyboardStickyView,
	useKeyboardState,
} from "react-native-keyboard-controller";
import * as v from "valibot";
import { useStore } from "zustand";
import Editor, { type EditorRef, type HeadingLevel } from "@/components/editor";
import { EditToolBar } from "@/components/post/editToolBar";
import { Pressable } from "@/components/pressable";
import { TrueSheetMenu } from "@/components/trueSheet";
import { MaterialDesignIcons } from "@/components/ui/materialDesignIcons";
import { Text } from "@/components/ui/text";
import { convertFromStateToMarkdown } from "@/lib/renderer/utils";
import { ToastAndroid } from "@/lib/toast";
import type { ScreenName } from "@/stack/screenName";
import type { ScreenParams } from "@/stack/screenParams";
import { WebServiceContext } from "@/state/web";
import { createPostScript } from "@/state/web/scripts";
import { CategoriesStore } from "@/store/categoriesStore";
import { userDataStore } from "@/store/userDataStore";
import { userStore } from "@/store/userStore";

const nodeimageSuccessResponse = v.object({
	success: v.literal(true),
	links: v.object({
		direct: v.pipe(v.string(), v.url(), v.regex(/^https?:\/\//)),
	}),
});

const ranks = [
	{
		label: "post.new.visibility.public",
		value: 0,
	},
	{
		label: "Lv1",
		value: 1,
	},
	{
		label: "Lv2",
		value: 2,
	},
	{
		label: "Lv3",
		value: 3,
	},
	{
		label: "Lv4",
		value: 4,
	},
	{
		label: "Lv5",
		value: 5,
	},
	{
		label: "Lv6",
		value: 6,
	},
	{
		label: "post.new.visibility.private",
		value: 255,
	},
];

const pickImage = async () => {
	const permissionResult =
		await ImagePicker.requestMediaLibraryPermissionsAsync();

	if (!permissionResult.granted) {
		return Promise.reject(new Error("Permission required"));
	}

	const result = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ["images"],
		quality: 1,
	});

	if (!result.canceled) {
		return result.assets[0].uri;
	}
};

type Props = NativeStackScreenProps<ScreenParams, typeof ScreenName.PostNew>;

const Screen = ({ navigation }: Props) => {
	const { t } = useTranslation();
	const editorRef = useRef<EditorRef>(null);
	const queryClient = useQueryClient();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [toolbarHeight, setToolbarHeight] = useState(0);
	const keyboardHeight = useKeyboardState((state) => state.height);
	const categorieTrueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const levelTrueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const categories = useStore(CategoriesStore, (s) => s.categories);
	const webServiceContext = useContext(WebServiceContext);

	const { handleSubmit, control, setValue } = useForm({
		defaultValues: {
			content: "",
			title: "",
			category: "",
			mode: "new-discussion" as const,
			rank: 0,
		},
	});

	const handlePublish = handleSubmit(
		(form) => {
			if (isSubmitting) {
				return;
			}

			setIsSubmitting(true);

			const publishRequest = webServiceContext.run(createPostScript(form));

			publishRequest
				.then((message) => {
					if (message.success) {
						ToastAndroid.show(t("post.new.success"), ToastAndroid.SHORT);
						queryClient.invalidateQueries({ queryKey: ["posts"] });
						queryClient.invalidateQueries({ queryKey: ["search"] });
						navigation.goBack();
					} else {
						ToastAndroid.show(t("post.new.failed"), ToastAndroid.SHORT);
					}
				})
				.catch((error: unknown) => {
					const timedOut = v.is(
						v.object({ code: v.literal("TIMEOUT") }),
						error,
					);
					ToastAndroid.show(
						t(timedOut ? "post.new.timeout" : "post.new.failed"),
						ToastAndroid.LONG,
					);
				})
				.finally(() => {
					setIsSubmitting(false);
				});
		},
		(errors) => {
			const error = Object.values(errors).find((value) => value?.message);
			ToastAndroid.show(
				typeof error?.message === "string"
					? error.message
					: t("post.new.formError"),
				ToastAndroid.SHORT,
			);
		},
	);

	const handleHeadingPress = useCallback((h: HeadingLevel) => {
		editorRef.current?.setHeading(h);
	}, []);

	const handleParagraphPress = useCallback(() => {
		editorRef.current?.setParagraph();
	}, []);

	const handleBoldPress = useCallback(() => {
		editorRef.current?.toggleBold();
	}, []);

	const handleItalicPress = useCallback(() => {
		editorRef.current?.toggleItalic();
	}, []);

	const handleBulletedListPress = useCallback(() => {
		editorRef.current?.toggleBulletedList();
	}, []);

	const handleImagePress = useCallback(async () => {
		const userId = userStore.getState().id;
		const apiKey = userDataStore.getState().nodeImageApiKey;

		if (userId == null || !apiKey) {
			ToastAndroid.show(
				t("settings.nodeImageApiKey.required"),
				ToastAndroid.LONG,
			);
			return;
		}

		try {
			const fileUri = await pickImage();
			if (!fileUri || userStore.getState().id !== userId) return;

			const file = new File(fileUri);
			const formData = new FormData();
			formData.append("image", file);

			const response = await fetch("https://api.nodeimage.com/api/upload", {
				method: "POST",
				body: formData,
				headers: {
					"X-API-Key": apiKey,
				},
			});

			if (!response.ok) {
				throw new Error("Upload failed");
			}

			const resData = await response.json();
			const result = v.safeParse(nodeimageSuccessResponse, resData);

			if (!result.success) {
				throw new Error("Invalid upload response");
			}

			if (userStore.getState().id !== userId) return;

			editorRef.current?.insertNodes([
				{
					type: "image",
					src: result.output.links.direct,
					altText: "",
				},
			]);
		} catch {
			ToastAndroid.show("Upload failed", ToastAndroid.LONG);
		}
	}, [t]);

	const handleUndoPress = useCallback(() => {
		editorRef.current?.undo();
	}, []);

	const handleRedoPress = useCallback(() => {
		editorRef.current?.redo();
	}, []);

	useEffect(() => {
		navigation.setOptions({
			title: "",
			headerRight: () => (
				<View className="flex-row items-center gap-6">
					<View className="flex-row gap-4">
						<Controller
							name="rank"
							control={control}
							rules={{
								required: t("post.new.validation.readingPermission"),
							}}
							render={({ field: { value } }) => {
								return (
									<Pressable
										onPress={() => {
											levelTrueSheetMenuRef.current?.present();
										}}
										className="rounded-full"
									>
										<View className="flex-row items-center gap-1 bg-accent pl-3 pr-2 py-1.5 rounded-full min-w-16 justify-end">
											<Text className="text-accent-foreground text-xs">
												{typeof value === "number"
													? t(
															ranks.find((x) => x.value === value)?.label ??
																"post.new.visibility.public",
														)
													: t("post.new.visibility.label")}
											</Text>
											<MaterialDesignIcons
												name="chevron-down"
												size={16}
												className="text-accent-foreground"
											/>
										</View>
									</Pressable>
								);
							}}
						/>
						<Controller
							name="category"
							control={control}
							rules={{
								required: t("post.new.validation.category"),
							}}
							render={({ field: { value } }) => {
								return (
									<Pressable
										onPress={() => {
											categorieTrueSheetMenuRef.current?.present();
										}}
										className="rounded-full"
									>
										<View className="flex-row items-center gap-1 bg-accent pl-3 pr-2 py-1.5 rounded-full justify-end">
											<Text className="text-accent-foreground text-xs">
												{value
													? categories.find((x) => x.slug === value)?.nameZh ||
														value
													: t("post.new.category.placeholder")}
											</Text>
											<MaterialDesignIcons
												name="chevron-down"
												size={16}
												className="text-accent-foreground"
											/>
										</View>
									</Pressable>
								);
							}}
						/>
					</View>
					<Pressable
						className="mr-2 rounded-full justify-center items-center bg-primary"
						accessibilityLabel={
							isSubmitting ? t("post.new.publishing") : t("post.new.publish")
						}
						accessibilityRole="button"
						accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
						disabled={isSubmitting}
						onPress={() => {
							handlePublish();
						}}
						style={{
							height: 36,
							aspectRatio: 1,
						}}
					>
						{isSubmitting && <ActivityIndicator size="small" />}
						{!isSubmitting && (
							<MaterialDesignIcons
								name="upload"
								size={22}
								className="text-primary-foreground"
							/>
						)}
					</Pressable>
				</View>
			),
		});
	}, [navigation, handlePublish, isSubmitting, control, categories, t]);

	return (
		<>
			<KeyboardGestureArea
				style={{
					flex: 1,
					justifyContent: "flex-end",
				}}
			>
				<View
					className="flex-1"
					style={{
						paddingBottom: keyboardHeight + toolbarHeight + 16,
					}}
				>
					<View className="px-6">
						<Controller
							name="title"
							control={control}
							rules={{
								required: t("post.new.validation.title"),
							}}
							render={({ field: { value, onChange } }) => {
								return (
									<TextInput
										placeholder={t("post.editor.title")}
										className="text-lg"
										value={value}
										onChangeText={(e) => {
											onChange(e);
										}}
									/>
								);
							}}
						/>
					</View>
					<View className="flex-1 px-6">
						<Editor
							ref={editorRef}
							placeholder={t("post.editor.placeholder")}
							dom={{
								nestedScrollEnabled: true,
								showsVerticalScrollIndicator: false,
								showsHorizontalScrollIndicator: false,
							}}
							onChange={(e) => {
								setValue(
									"content",
									e ? convertFromStateToMarkdown(JSON.parse(e)) : "",
								);
							}}
						/>
					</View>
				</View>
				<KeyboardStickyView
					style={{
						position: "absolute",
						width: "100%",
					}}
				>
					<View
						onLayout={(event) => {
							const nextHeight = event.nativeEvent.layout.height;
							if (nextHeight !== toolbarHeight) {
								setToolbarHeight(nextHeight);
							}
						}}
					>
						<EditToolBar
							onUndoPress={handleUndoPress}
							onRedoPress={handleRedoPress}
							onHeadingPress={handleHeadingPress}
							onParagraphPress={handleParagraphPress}
							onBoldPress={handleBoldPress}
							onItalicPress={handleItalicPress}
							onBulletedListPress={handleBulletedListPress}
							onImagePress={handleImagePress}
						/>
					</View>
				</KeyboardStickyView>
			</KeyboardGestureArea>
			<TrueSheetMenu
				ref={categorieTrueSheetMenuRef}
				menus={categories.map((x) => {
					return {
						label: x.nameZh,
						key: x.slug,
						onPress: () => {
							setValue("category", x.slug);
							categorieTrueSheetMenuRef.current?.dismiss();
						},
					};
				})}
			/>
			<TrueSheetMenu
				ref={levelTrueSheetMenuRef}
				menus={ranks.map((x) => {
					return {
						label: t(x.label),
						key: x.value.toString(),
						onPress: () => {
							setValue("rank", x.value);
							levelTrueSheetMenuRef.current?.dismiss();
						},
					};
				})}
			/>
		</>
	);
};

export default Screen;
