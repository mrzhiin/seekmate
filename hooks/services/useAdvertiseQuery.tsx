import { useQuery } from "@tanstack/react-query";
import * as v from "valibot";
import { nsClient } from "@/lib/http/client";

const SuccessResSchema = v.object({
	success: v.literal(true),
	data: v.array(
		v.object({
			order: v.number(),
			img: v.pipe(v.string(), v.nonEmpty(), v.url()),
			target: v.pipe(v.string(), v.nonEmpty(), v.url()),
		}),
	),
});

export const useAdvertiseQuery = () => {
	const result = useQuery({
		queryKey: ["api/promotion/list"],
		queryFn: async ({ signal }) => {
			const res = await nsClient("api/promotion/list", { signal });
			const resData: unknown = await res.json();
			const result = v.safeParse(SuccessResSchema, resData);

			if (result.success) {
				const data = result.output;
				return data.data;
			} else {
				throw new Error("API fail");
			}
		},
	});

	return result;
};
