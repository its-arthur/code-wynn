"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppReady } from "@/contexts/app-ready-context";

const FADE_DURATION_MS = 400;

export function MountLoadingScreen() {
	const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");
	const elRef = useRef<HTMLDivElement>(null);
	const { ready } = useAppReady();

	const handleTransitionEnd = useCallback(() => {
		setPhase("gone");
	}, []);

	useEffect(() => {
		if (!ready) return;
		const startFade = () => setPhase("fading");
		const id = requestAnimationFrame(() => {
			requestAnimationFrame(startFade);
		});
		return () => cancelAnimationFrame(id);
	}, [ready]);

	useEffect(() => {
		if (phase !== "fading") return;
		const el = elRef.current;
		if (!el) return;
		const onEnd = (e: TransitionEvent) => {
			if (e.propertyName === "opacity") handleTransitionEnd();
		};
		el.addEventListener("transitionend", onEnd);
		return () => el.removeEventListener("transitionend", onEnd);
	}, [phase, handleTransitionEnd]);

	if (phase === "gone") return null;

	return (
		<div
			ref={elRef}
			className={cn(
				"fixed inset-0 z-100 flex items-center justify-center bg-background transition-opacity ease-out",
				phase === "visible" ? "opacity-100" : "opacity-0",
			)}
			style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
			aria-hidden="true"
		>
			<div className="flex flex-col items-center gap-4">
				<p className="text-8xl font-pixel-circle text-white capitalize">
					X
				</p>
				<div>
				<p className="text-xs font-bold font-mono text-white capitalize">
					project-wynn
					</p>
				</div>
				
			</div>
		</div>
	);
}
