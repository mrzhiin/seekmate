import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

const deviceLanguage = getLocales()[0].languageCode;

if (!i18n.isInitialized) {
	i18n.use(initReactI18next).init({
		resources: {
			zh: { translation: zh },
			en: { translation: en },
		},
		lng: deviceLanguage || "",
		fallbackLng: "en",
		interpolation: {
			escapeValue: false,
		},
	});
}

export default i18n;
