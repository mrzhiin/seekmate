import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import { useResolveClassNames } from "uniwind";

export const OriginalSkeleton = () => {
	const colorMode = "light";
	const t1 = useResolveClassNames("text-xl");
	const t2 = useResolveClassNames("text-base");
	const t3 = useResolveClassNames("text-sm");

	return (
		<MotiView
			transition={{
				type: "timing",
			}}
			className="py-4 gap-6"
		>
			<MotiView className="px-6">
				<Skeleton colorMode={colorMode} width={"100%"} height={t1.lineHeight} />
			</MotiView>
			<MotiView className="pl-6 pr-1 flex-row items-center gap-3">
				<Skeleton colorMode={colorMode} radius="round" height={40} width={40} />
				<Skeleton colorMode={colorMode} width={100} height={t2.fontSize} />
			</MotiView>
			<MotiView className="px-6 flex-row gap-2">
				<Skeleton colorMode={colorMode} width={"50%"} height={t3.lineHeight} />
			</MotiView>
			<MotiView className="px-6 gap-2">
				<Skeleton colorMode={colorMode} width={"100%"} height={t3.lineHeight} />
				<Skeleton colorMode={colorMode} width={"100%"} height={t3.lineHeight} />
			</MotiView>
		</MotiView>
	);
};
