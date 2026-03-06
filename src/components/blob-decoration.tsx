"use client";

/**
 * Decorative blobs placed in corners (center at corner so they overflow).
 * Same positioning behavior as DotGridDecoration: top-left and bottom-right.
 * Use *OffsetX / *OffsetY (px) to nudge position from the corner.
 * Use swapPositions to put green at bottom-right and yellow at top-left.
 */
export function BlobDecoration({
	className,
	greenSize = 400,
	yellowSize = 500,
	greenOpacity = 0.2,
	yellowOpacity = 0.2,
	greenOffsetX = 0,
	greenOffsetY = 0,
	yellowOffsetX = 0,
	yellowOffsetY = 0,
	swapPositions = false,
}: {
	className?: string;
	greenSize?: number;
	yellowSize?: number;
	greenOpacity?: number;
	yellowOpacity?: number;
	/** Offset in px from corner (top-left blob). */
	greenOffsetX?: number;
	greenOffsetY?: number;
	/** Offset in px from corner (bottom-right blob). */
	yellowOffsetX?: number;
	yellowOffsetY?: number;
	/** If true, green blob is bottom-right and yellow blob is top-left. */
	swapPositions?: boolean;
}) {
	const topLeftBlob = swapPositions
		? {
				size: yellowSize,
				opacity: yellowOpacity,
				offsetX: yellowOffsetX,
				offsetY: yellowOffsetY,
				borderRadius: "30% 70% 70% 30% / 40% 60% 40% 60%",
				background: `rgba(255, 230, 140, ${yellowOpacity})`,
			}
		: {
				size: greenSize,
				opacity: greenOpacity,
				offsetX: greenOffsetX,
				offsetY: greenOffsetY,
				borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
				background: `rgba(167, 235, 100, ${greenOpacity})`,
			};

	const bottomRightBlob = swapPositions
		? {
				size: greenSize,
				opacity: greenOpacity,
				offsetX: greenOffsetX,
				offsetY: greenOffsetY,
				borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
				background: `rgba(167, 235, 100, ${greenOpacity})`,
			}
		: {
				size: yellowSize,
				opacity: yellowOpacity,
				offsetX: yellowOffsetX,
				offsetY: yellowOffsetY,
				borderRadius: "30% 70% 70% 30% / 40% 60% 40% 60%",
				background: `rgba(255, 230, 140, ${yellowOpacity})`,
			};

	return (
		<div
			className={`pointer-events-none absolute inset-0 overflow-visible ${className ?? ""}`}
			aria-hidden
		>
			<div
				className="absolute left-0 top-0"
				style={{
					width: topLeftBlob.size,
					height: topLeftBlob.size,
					borderRadius: topLeftBlob.borderRadius,
					background: topLeftBlob.background,
					filter: "blur(40px)",
					transform: `translate(calc(-50% + ${topLeftBlob.offsetX}px), calc(-50% + ${topLeftBlob.offsetY}px))`,
				}}
			/>
			<div
				className="absolute bottom-0 right-0"
				style={{
					width: bottomRightBlob.size,
					height: bottomRightBlob.size,
					borderRadius: bottomRightBlob.borderRadius,
					background: bottomRightBlob.background,
					filter: "blur(40px)",
					transform: `translate(calc(50% + ${bottomRightBlob.offsetX}px), calc(50% + ${bottomRightBlob.offsetY}px))`,
				}}
			/>
		</div>
	);
}
