import { Host, Switch } from "@expo/ui/jetpack-compose";
import { useStore } from "zustand";
import { appStore } from "@/store/appStore";
import { Item } from "./Item";

export const AuthCheckIn = () => {
	const autoCheckIn = useStore(appStore, (s) => s.autoCheckIn);
	const update = useStore(appStore, (s) => s.update);

	const toggleAutoCheckIn = () => {
		update({ autoCheckIn: !autoCheckIn });
	};

	return (
		<Item
			label="自动签到"
			subLabel="启动时尝试签到"
			right={
				<Host matchContents>
					<Switch value={autoCheckIn} onCheckedChange={toggleAutoCheckIn} />
				</Host>
			}
			onPress={toggleAutoCheckIn}
		/>
	);
};
