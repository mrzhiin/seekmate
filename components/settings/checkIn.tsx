import { useRef } from "react";
import { useStore } from "zustand";
import { appStore, CheckInType } from "@/store/appStore";
import { TrueSheetMenu } from "../trueSheet";
import { MaterialDesignIcons } from "../ui/materialDesignIcons";
import { Item } from "./Item";

export const CheckIn = () => {
	const trueSheetMenuRef = useRef<TrueSheetMenu>(null);
	const checkInType = useStore(appStore, (s) => s.checkInType);
	const update = useStore(appStore, (s) => s.update);

	const isRandom = checkInType === CheckInType.Random;

	return (
		<>
			<Item
				label="签到方式"
				subLabel={isRandom ? "随机" : "固定"}
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
						label: "固定",
						onPress: () => {
							update({ checkInType: CheckInType.Fixed });
							trueSheetMenuRef.current?.dismiss();
						},
					},
					{
						key: CheckInType.Random,
						label: "随机",
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
