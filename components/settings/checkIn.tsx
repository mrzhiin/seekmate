import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { appStore, CheckInType } from "@/store/appStore";
import { TrueSheetMenu } from "../trueSheet";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
import { Item } from "./Item";

export const CheckIn = () => {
	const trueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const checkInType = useStore(appStore, (s) => s.checkInType);
	const update = useStore(appStore, (s) => s.update);
	const { t } = useTranslation();

	const isRandom = checkInType === CheckInType.Random;

	return (
		<>
			<Item
				label={t("settings.checkIn.label")}
				subLabel={
					isRandom ? t("settings.checkIn.random") : t("settings.checkIn.fixed")
				}
				right={
					<MaterialDesignIcons
						name={isRandom ? "dice-multiple" : "dice-5"}
						size={24}
						className="text-secondary-foreground mr-3"
					/>
				}
				onPress={() => {
					trueSheetMenuRef.current?.present();
				}}
			/>
			<TrueSheetMenu
				ref={trueSheetMenuRef}
				menus={[
					{
						key: CheckInType.Fixed,
						label: t("settings.checkIn.fixed"),
						onPress: () => {
							update({ checkInType: CheckInType.Fixed });
							trueSheetMenuRef.current?.dismiss();
						},
					},
					{
						key: CheckInType.Random,
						label: t("settings.checkIn.random"),
						onPress: () => {
							update({ checkInType: CheckInType.Random });
							trueSheetMenuRef.current?.dismiss();
						},
					},
				]}
			/>
		</>
	);
};
