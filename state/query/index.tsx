import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";

export const QueryProvider = (props: React.PropsWithChildren) => {
	const { children } = props;

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

export { queryClient };
