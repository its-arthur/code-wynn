"use client";

const DOT_STYLE = (dotOpacity: number, dotSpacing: number) => ({
	backgroundImage: `radial-gradient(circle, currentColor ${dotSpacing * 0.12}px, transparent ${dotSpacing * 0.12}px)`,
	backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
	color: `rgba(0,0,0,${dotOpacity})`,
});

const DOT_STYLE_DARK = (dotOpacity: number, dotSpacing: number) => ({
	backgroundImage: `radial-gradient(circle, rgba(255,255,255,${dotOpacity}) ${dotSpacing * 0.12}px, transparent ${dotSpacing * 0.12}px)`,
	backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
});

/**
 * Small dot grid patch for use as a separate decoration.
 */
function DotPatch({
	className,
	dotOpacity = 0.15,
	dotSpacing = 20,
	size = 96,
}: {
	className?: string;
	dotOpacity?: number;
	dotSpacing?: number;
	size?: number;
}) {
	return (
		<div
			className={`pointer-events-none absolute rounded-lg overflow-hidden ${className ?? ""}`}
			style={{ width: size, height: size }}
			aria-hidden
		>
			<div
				className="absolute inset-0"
				style={DOT_STYLE(dotOpacity, dotSpacing)}
			/>
			<div
				className="absolute inset-0 hidden dark:block"
				style={DOT_STYLE_DARK(dotOpacity, dotSpacing)}
			/>
		</div>
	);
}

/**
 * Small corner bracket SVG for use as a separate decoration.
 */
function CornerBracket({
	className,
	rotate = 0,
}: {
	className?: string;
	rotate?: 0 | 90 | 180 | 270;
}) {
	const rot = { 0: "", 90: "rotate-90", 180: "rotate-180", 270: "-rotate-90" }[
		rotate
	];
	return (
		<svg
			className={`absolute h-10 w-10 text-emerald-500/25 ${rot} ${className ?? ""}`}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			aria-hidden
		>
			<path d="M4 4v8h8" />
		</svg>
	);
}

/**
 * Decorative dot grids and corner brackets placed separately (small, not full bleed).
 */
export function DotGridDecoration({
	className,
	dotOpacity = 0.12,
	dotSpacing = 20,
	patchSize = 280,
	showCorners = true,
}: {
	className?: string;
	dotOpacity?: number;
	dotSpacing?: number;
	patchSize?: number;
	showCorners?: boolean;
}) {
	return (
		<div
			className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
			aria-hidden
		>
			{/* Dot patches: center in corner so they overflow (top right, bottom left) */}
			<DotPatch
				className="right-0 top-0 translate-x-1/2 -translate-y-1/2"
				dotOpacity={dotOpacity}
				dotSpacing={dotSpacing}
				size={patchSize}
			/>
			<DotPatch
				className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2"
				dotOpacity={dotOpacity}
				dotSpacing={dotSpacing}
				size={patchSize}
			/>
		</div>
	);
}
