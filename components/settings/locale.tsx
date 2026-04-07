import * as Application from "expo-application";
import { ActivityAction, startActivityAsync } from "expo-intent-launcher";
import { useTranslation } from "react-i18next";
import { Item } from "./Item";

export const Locale = () => {
	const { i18n, t } = useTranslation();

	return (
		<Item
			label={t("settings.locale")}
			subLabel={i18n.language.toLocaleUpperCase()}
			onPress={() => {
				startActivityAsync(ActivityAction.APP_LOCALE_SETTINGS, {
					data: `package:${Application.applicationId}`,
				});
			}}
		/>
	);
};
