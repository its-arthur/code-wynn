"use client";

import { cn } from "@/lib/utils";

const E_PER_EB = 64;
const E_PER_LE = E_PER_EB * 64; // 4 096
const E_PER_STX = E_PER_LE * 64; // 262 144

export interface PriceBreakdown {
	stx: number;
	le: number;
	eb: number;
	e: number;
}

export function toPriceBreakdown(emeralds: number): PriceBreakdown {
	let remaining = Math.floor(Math.abs(emeralds));
	const stx = Math.floor(remaining / E_PER_STX);
	remaining %= E_PER_STX;
	const le = Math.floor(remaining / E_PER_LE);
	remaining %= E_PER_LE;
	const eb = Math.floor(remaining / E_PER_EB);
	const e = remaining % E_PER_EB;
	return { stx, le, eb, e };
}

const DENOMINATIONS: { key: keyof PriceBreakdown; icon: string; label: string }[] = [
	{ key: "stx", icon: "/currentcy/stk.webp", label: "stx" },
	{ key: "le", icon: "/currentcy/le.webp", label: "le" },
	{ key: "eb", icon: "/currentcy/eb.webp", label: "eb" },
	{ key: "e", icon: "/currentcy/em.webp", label: "e" },
];

interface EmeraldPriceProps {
	price: number;
	size?: "sm" | "md";
	hideZero?: boolean;
	className?: string;
}

export function EmeraldPrice({
	price,
	size = "sm",
	hideZero = true,
	className,
}: EmeraldPriceProps) {
	const bd = toPriceBreakdown(price);
	const iconSize = size === "sm" ? "size-3.5" : "size-4";
	const textSize = size === "sm" ? "text-xs" : "text-sm";

	const parts = DENOMINATIONS.filter(
		({ key }) => !hideZero || bd[key] > 0,
	);

	if (parts.length === 0) {
		return (
			<span className={cn("inline-flex items-center gap-0.5", textSize, className)}>
				<img src="/currentcy/em.webp" alt="e" className={cn(iconSize, "inline-block")} />
				<span className="tabular-nums font-medium">0</span>
			</span>
		);
	}

	return (
		<span className={cn("inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5", textSize, className)}>
			{parts.map(({ key, icon, label }) => (
				<span key={key} className="inline-flex items-center gap-0.5">
					<img src={icon} alt={label} className={cn(iconSize, "inline-block")} />
					<span className="tabular-nums font-medium">{bd[key]}</span>
				</span>
			))}
		</span>
	);
}
