"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FADE_DURATION_MS = 400;

export function MountLoadingScreen() {
	const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");
	const elRef = useRef<HTMLDivElement>(null);

	const handleTransitionEnd = useCallback(() => {
		setPhase("gone");
	}, []);

	useEffect(() => {
		const startFade = () => setPhase("fading");
		const id = requestAnimationFrame(() => {
			requestAnimationFrame(startFade);
		});
		return () => cancelAnimationFrame(id);
	}, []);

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
				<p className="text-xs font-mono text-white capitalize">
					Loading...
				</p>
				</div>
				
			</div>
		</div>
	);
}
