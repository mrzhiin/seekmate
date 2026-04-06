import { useCSSVariable } from "uniwind";

export const useCSSVariableString = (name: string) => {
	const cssVariable = useCSSVariable(name);
	return typeof cssVariable === "string" ? cssVariable : undefined;
};
