import * as v from "valibot";

const _SuccessResSchema = v.object({
	success: v.literal(true),
	data: v.nullish(v.string()),
});

export const getStyle = async (_signal?: AbortSignal) => {
	return "";
};

export const postStyle = async (_style: string, _signal?: AbortSignal) => {};
