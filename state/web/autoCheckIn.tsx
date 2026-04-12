import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ToastAndroid } from "react-native";
import { useStore } from "zustand";
import { getAttendanceQueryOptions } from "@/hooks/services/useAttendanceQuery";
import { queryClient } from "@/state/query";
import { appStore } from "@/store/appStore";
import { userStore } from "@/store/userStore";
import { WebServiceContext } from ".";
import { createAttendanceScript } from "./scripts";

export const AutoCheckIn = () => {
	const userId = useStore(userStore, (s) => s.id);
	const autoCheckIn = useStore(appStore, (s) => s.autoCheckIn);
	const checkInType = useStore(appStore, (s) => s.checkInType);
	const webServiceContext = useContext(WebServiceContext);
	const { t } = useTranslation();

	useEffect(() => {
		if (!autoCheckIn || !userId) {
			return;
		}

		let cancelled = false;

		queryClient
			.fetchQuery(getAttendanceQueryOptions(userId))
			.then((attendance) => {
				if (!attendance && !cancelled) {
					return webServiceContext.run(createAttendanceScript(checkInType));
				}
			})
			.then((res) => {
				if (res?.success) {
					ToastAndroid.show(t("mine.attendance.success"), ToastAndroid.SHORT);
				} else {
					ToastAndroid.show(t("mine.attendance.failed"), ToastAndroid.SHORT);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [autoCheckIn, userId, checkInType, webServiceContext.run, t]);

	return null;
};
