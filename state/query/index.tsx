import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { asyncStoragePersister, queryClient } from "@/lib/query";

export const QueryProvider = (props: React.PropsWithChildren) => {
	const { children } = props;

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister: asyncStoragePersister,
				maxAge: 1000 * 60 * 60 * 24,
				dehydrateOptions: {
					shouldDehydrateQuery: (query) => query.meta?.persist === true,
				},
			}}
		>
			{children}
		</PersistQueryClientProvider>
	);
};

export { queryClient };
