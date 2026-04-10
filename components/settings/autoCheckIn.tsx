import { Host, Switch } from "@expo/ui/jetpack-compose";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { appStore } from "@/store/appStore";
import { Item } from "./Item";

export const AuthCheckIn = () => {
	const autoCheckIn = useStore(appStore, (s) => s.autoCheckIn);
	const update = useStore(appStore, (s) => s.update);
	const { t } = useTranslation();

	const toggleAutoCheckIn = () => {
		update({ autoCheckIn: !autoCheckIn });
	};

	return (
		<Item
			label={t("settings.autoCheckIn.label")}
			subLabel={t("settings.autoCheckIn.description")}
			right={
				<Host matchContents>
					<Switch value={autoCheckIn} onCheckedChange={toggleAutoCheckIn} />
				</Host>
			}
			onPress={toggleAutoCheckIn}
		/>
	);
};
