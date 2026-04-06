import { useCallback, useState } from "react";

export const useRefresh = (refetch: () => Promise<unknown>) => {
	const [isRefreshing, setIsRefreshing] = useState(false);

	const refresh = useCallback(async () => {
		setIsRefreshing(true);

		try {
			await refetch();
		} finally {
			setIsRefreshing(false);
		}
	}, [refetch]);

	return {
		isRefreshing,
		refresh,
	};
};
