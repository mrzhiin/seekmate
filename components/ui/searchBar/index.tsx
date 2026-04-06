import { useRef } from "react";
import {
	type InputModeOptions,
	TextInput,
	type TextInputChangeEvent,
	View,
} from "react-native";
import { Pressable } from "@/components/pressable";
import { useCSSVariableString } from "@/hooks/useStyle";
import { MaterialDesignIcons } from "../materialDesignIcons";

export const SearchBar = (props: {
	autoFocus?: boolean;
	onFocus?: () => void;
	onSubmitEditing?: (e: string) => void;
	placeholder?: string;
	value?: string;
	onChange?: (e: TextInputChangeEvent) => void;
	onChangeText?: (e: string) => void;
	inputMode?: InputModeOptions;
}) => {
	const textInputRef = useRef<TextInput>(null);
	const placeholderColo = useCSSVariableString("--color-muted-foreground");

	return (
		<View
			style={[
				{
					height: 48,
				},
			]}
			className="bg-secondary rounded-3xl items-center gap-2 px-4 flex-row overflow-hidden"
		>
			<TextInput
				autoFocus={props.autoFocus}
				value={props.value}
				placeholder={props.placeholder}
				placeholderTextColor={placeholderColo}
				focusable={false}
				className={`text-secondary-foreground text-sans text-sm flex-1`}
				onChangeText={props.onChangeText}
				onChange={props.onChange}
				onFocus={props.onFocus}
				onSubmitEditing={(e) => {
					const text = e.nativeEvent.text;
					props.onSubmitEditing?.(text);
				}}
				inputMode={props.inputMode}
			/>
			<Pressable
				onPress={() => {
					if (props.value) {
						textInputRef.current?.clear();
						textInputRef.current?.blur();
						props.onSubmitEditing?.("");
					}
				}}
			>
				<MaterialDesignIcons
					name={props.value ? "close" : "magnify"}
					size={24}
				/>
			</Pressable>
		</View>
	);
};
