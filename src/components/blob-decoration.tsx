"use client";

/**
 * Decorative blobs placed in corners (center at corner so they overflow).
 * Same positioning behavior as DotGridDecoration: top-left and bottom-right.
 */
export function BlobDecoration({
	className,
	greenSize = 400,
	yellowSize = 500,
	greenOpacity = 0.2,
	yellowOpacity = 0.2,
}: {
	className?: string;
	greenSize?: number;
	yellowSize?: number;
	greenOpacity?: number;
	yellowOpacity?: number;
}) {
	return (
		<div
			className={`pointer-events-none absolute inset-0 overflow-visible ${className ?? ""}`}
			aria-hidden
		>
			{/* Top-left: green blob, center at corner so it overflows */}
			<div
				className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
				style={{
					width: greenSize,
					height: greenSize,
					borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
					background: `rgba(167, 235, 100, ${greenOpacity})`,
					filter: "blur(40px)",
				}}
			/>
			{/* Bottom-right: yellow blob, center at corner so it overflows */}
			<div
				className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2"
				style={{
					width: yellowSize,
					height: yellowSize,
					borderRadius: "30% 70% 70% 30% / 40% 60% 40% 60%",
					background: `rgba(255, 230, 140, ${yellowOpacity})`,
					filter: "blur(40px)",
				}}
			/>
		</div>
	);
}
