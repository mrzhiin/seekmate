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
		queryFn: async () => {
			const res = await nsClient.get("api/promotion/list");
			const resData = res.data;
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
