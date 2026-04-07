import dayjs from "dayjs";
import "dayjs/locale/zh-cn.js";
import "@/i18n";
import { useLocales } from "expo-localization";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

dayjs.locale("zh-cn");

export const LocalizationProvider = (props: React.PropsWithChildren) => {
	const locales = useLocales();
	const { i18n } = useTranslation();

	useEffect(() => {
		const locale = locales[0];

		if (locales && locale.languageCode) {
			i18n.changeLanguage(locale.languageCode);
		}
	}, [locales, i18n]);

	return props.children;
};
