import dayjs from "dayjs";
import "dayjs/locale/zh-cn.js";

dayjs.locale("zh-cn");

export const LocalizationProvider = (props: React.PropsWithChildren) => {
	return props.children;
};
