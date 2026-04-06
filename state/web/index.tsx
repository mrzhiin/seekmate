import { createContext, type PropsWithChildren } from "react";
import { AutoCheckIn } from "./autoCheckIn";

export const WebServiceContext = createContext(null);

export const WebServiceProvider = (props: PropsWithChildren) => {
	const { children } = props;

	return (
		<>
			{children}
			<AutoCheckIn />
		</>
	);
};
