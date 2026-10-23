import * as v from "valibot";

// TODO：实现远端样式读写，供 lib/userData 的配置同步使用；当前为空实现，请保留，勿作为无用代码删除。
const _SuccessResSchema = v.object({
	success: v.literal(true),
	data: v.nullish(v.string()),
});

export const getStyle = async (_signal?: AbortSignal) => {
	return "";
};

export const postStyle = async (_style: string, _signal?: AbortSignal) => {};
