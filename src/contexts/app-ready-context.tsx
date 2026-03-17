"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type AppReadyContextValue = {
	ready: boolean;
	setReady: (ready: boolean) => void;
};

const AppReadyContext = createContext<AppReadyContextValue | null>(null);

export function AppReadyProvider({ children }: { children: ReactNode }) {
	const [ready, setReady] = useState(false);
	return (
		<AppReadyContext.Provider value={{ ready, setReady }}>
			{children}
		</AppReadyContext.Provider>
	);
}

export function useAppReady() {
	const ctx = useContext(AppReadyContext);
	if (!ctx) {
		return { ready: true, setReady: () => {} };
	}
	return ctx;
}

/** For non-home routes: mark app ready on mount so loading screen fades immediately. */
export function RouteReadyGate() {
	const pathname = usePathname();
	const { setReady } = useAppReady();

	useEffect(() => {
		if (pathname !== "/") {
			setReady(true);
		}
	}, [pathname, setReady]);

	return null;
}
