import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToastAndroid, View } from "react-native";
import { useMineRefreshContext } from "@/components/mine/mineView";
import { Text } from "@/components/ui/text";
import { useAttendanceQuery } from "@/hooks/services/useAttendanceQuery";
import { WebServiceContext } from "@/state/web";
import { createAttendanceScript } from "@/state/web/scripts";
import { CheckInType } from "@/store/appStore";
import { Pressable } from "../pressable";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";

export const Attendance = () => {
	const { registerRefresh, unregisterRefresh } = useMineRefreshContext();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { t } = useTranslation();
	const { data, refetch, isLoading, isFetching } = useAttendanceQuery();
	const signedInData = data ?? null;
	const hasSignedIn = signedInData !== null;
	const isInitialLoading = data === undefined && (isLoading || isFetching);
	const webServiceContext = useContext(WebServiceContext);

	const trigger = async () => {
		if (isSubmitting || isLoading || isFetching || hasSignedIn) return;

		setIsSubmitting(true);
		webServiceContext
			.run(createAttendanceScript(CheckInType.Fixed))
			?.then((message) => {
				if (message?.success) {
					refetch();
					ToastAndroid.show(t("mine.attendance.success"), ToastAndroid.SHORT);
				} else {
					ToastAndroid.show(t("mine.attendance.failed"), ToastAndroid.SHORT);
				}
			})
			.catch((_) => {
				ToastAndroid.show(t("mine.attendance.failed"), ToastAndroid.SHORT);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	};

	useEffect(() => {
		const refresh = () => refetch();

		registerRefresh(refresh);
		return () => {
			unregisterRefresh(refresh);
		};
	}, [refetch, registerRefresh, unregisterRefresh]);

	return (
		<Pressable
			className="rounded-xl bg-muted flex-1 p-4"
			onPress={trigger}
			disabled={isSubmitting || isInitialLoading || hasSignedIn}
		>
			<View className="gap-2 items-center">
				{signedInData ? (
					<>
						<View
							className="grow items-center justify-center"
							style={{
								height: 24,
							}}
						>
							<MaterialDesignIcons
								size={24}
								name="check-circle-outline"
								className="text-green-500"
							/>
						</View>
						<Text className="text-base">
							{t("mine.attendance.signedIn", { coins: signedInData.coins })}
						</Text>
					</>
				) : isSubmitting ? (
					<>
						<View
							className="grow items-center justify-center"
							style={{
								height: 24,
							}}
						>
							<MaterialDesignIcons
								size={24}
								name="progress-clock"
								className="text-secondary-foreground"
							/>
						</View>
						<Text className="text-base">{t("mine.attendance.signingIn")}</Text>
					</>
				) : isInitialLoading ? (
					<>
						<View
							className="grow items-center justify-center"
							style={{
								height: 24,
							}}
						>
							<MaterialDesignIcons
								size={24}
								name="progress-clock"
								className="text-secondary-foreground"
							/>
						</View>
						<Text className="text-base">{t("mine.attendance.loading")}</Text>
					</>
				) : (
					<>
						<View
							className="grow items-center justify-center"
							style={{
								height: 24,
							}}
						>
							<MaterialDesignIcons
								size={24}
								name="alert-circle-outline"
								className="text-secondary-foreground"
							/>
						</View>
						<Text className="text-base">
							{t("mine.attendance.notSignedIn")}
						</Text>
					</>
				)}
			</View>
		</Pressable>
	);
};
