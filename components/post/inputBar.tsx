import { LinearGradient } from "expo-linear-gradient";
import {
	type Ref,
	useContext,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, ToastAndroid, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariableString } from "@/hooks/useStyle";
import { WebServiceContext } from "@/state/web";
import { createPostCommentScript } from "@/state/web/scripts";
import { Pressable } from "../pressable";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";

export type InputBar = {
	appendText: (text: string) => void;
};

export const InputBar = ({
	postId,
	onPost,
	ref,
}: {
	postId: number;
	onPost?: () => void | Promise<void>;
	ref?: Ref<InputBar>;
}) => {
	const boxShadowColor = useCSSVariableString("--color-border");
	const linearColor = useCSSVariableString("--color-background");
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [text, setText] = useState("");
	const inputRef = useRef<TextInput>(null);
	const insets = useSafeAreaInsets();
	const webServiceContext = useContext(WebServiceContext);

	useImperativeHandle(ref, () => {
		return {
			appendText: (text: string) => {
				setText((p) => `${p.length ? `${p} ` : ""}${text}`);
			},
		};
	}, []);

	const createComment = () => {
		const content = text.trim();
		if (isLoading || !content) return;

		const payload = {
			content,
			mode: "new-comment",
			postId,
		};

		setIsLoading(true);
		webServiceContext
			.run(createPostCommentScript(payload))
			?.then((message) => {
				if (message.success) {
					setText("");
					onPost?.();
					ToastAndroid.show(t("post.inputBar.success"), ToastAndroid.SHORT);
				} else {
					ToastAndroid.show(t("post.inputBar.failed"), ToastAndroid.SHORT);
				}
			})
			.catch((_) => {
				ToastAndroid.show(t("post.inputBar.failed"), ToastAndroid.SHORT);
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	return (
		<View
			style={{
				paddingBottom: insets.bottom,
			}}
		>
			<LinearGradient
				colors={["transparent", linearColor ?? "transparent"]}
				start={{ x: 0.5, y: 0 }}
				end={{ x: 0.5, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>
			<View
				className="bg-secondary flex-row items-end rounded-4xl border-4 border-background mx-4 mb-4"
				style={{
					boxShadow: [
						{
							offsetX: 0,
							offsetY: 0,
							blurRadius: 4,
							color: boxShadowColor,
						},
					],
				}}
			>
				<TextInput
					ref={inputRef}
					value={text}
					onChangeText={(e) => {
						setText(e);
					}}
					multiline
					numberOfLines={4}
					autoFocus={false}
					placeholder={t("post.inputBar.placeholder")}
					className="font-sans text-base text-foreground flex-1 pl-2"
					readOnly={isLoading}
				/>
				<View className="flex-row items-center p-2 rounded-full">
					<Pressable
						className="rounded-full justify-center items-center bg-primary"
						style={{
							height: 32,
							aspectRatio: 1,
						}}
						onPress={createComment}
						disabled={isLoading}
					>
						{isLoading ? (
							<MaterialDesignIcons
								name="progress-helper"
								size={24}
								className="text-secondary"
							/>
						) : (
							<MaterialDesignIcons
								name="arrow-up"
								size={24}
								className="text-primary-foreground"
							/>
						)}
					</Pressable>
				</View>
			</View>
		</View>
	);
};
