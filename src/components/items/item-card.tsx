"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ItemEntry } from "@/types/item";
import { cn } from "@/lib/utils";
import { wynnItemGuideUrl } from "@/lib/wynn-cdn";

const RARITY_COLORS: Record<string, string> = {
	common: "text-gray-400",
	unique: "text-yellow-300",
	rare: "text-pink-400",
	legendary: "text-cyan-300",
	set: "text-green-400",
	fabled: "text-red-400",
	mythic: "text-purple-400",
};

const RARITY_BADGE: Record<string, string> = {
	common: "bg-gray-700/60 text-gray-300 border-gray-600",
	unique: "bg-yellow-900/40 text-yellow-300 border-yellow-700/60",
	rare: "bg-pink-900/40 text-pink-300 border-pink-700/60",
	legendary: "bg-cyan-900/40 text-cyan-200 border-cyan-700/60",
	set: "bg-green-900/40 text-green-300 border-green-700/60",
	fabled: "bg-red-900/40 text-red-300 border-red-700/60",
	mythic: "bg-purple-900/40 text-purple-300 border-purple-700/60",
};

const TIER_BADGE: Record<number, string> = {
	0: "bg-gray-700/60 text-gray-300 border-gray-600",
	1: "bg-yellow-900/40 text-yellow-300 border-yellow-700/60",
	2: "bg-pink-900/40 text-pink-300 border-pink-700/60",
	3: "bg-cyan-900/40 text-cyan-200 border-cyan-700/60",
};

function formatType(type: string, subType?: string) {
	const t = type.replace(/([A-Z])/g, " $1").trim();
	if (!subType) return t;
	const s = subType.replace(/([A-Z])/g, " $1").trim();
	return `${s} ${t}`;
}

function getIconName(item: ItemEntry): string | null {
	if (!item.icon?.value) return null;
	if (typeof item.icon.value === "string") return item.icon.value;
	return item.icon.value.name ?? null;
}

export function ItemCard({
	name,
	item,
}: {
	name: string;
	item: ItemEntry;
}) {
	const [imgError, setImgError] = useState(false);
	const iconName = getIconName(item);
	const rarity = typeof item.rarity === "string" ? item.rarity.toLowerCase() : null;
	const tier = typeof item.tier === "number" ? item.tier : null;
	const nameColor = rarity ? RARITY_COLORS[rarity] ?? "text-foreground" : "text-foreground";
	const badgeClass = rarity
		? RARITY_BADGE[rarity]
		: tier != null
			? TIER_BADGE[tier] ?? TIER_BADGE[0]
			: null;
	const label = rarity ?? (tier != null ? `Tier ${tier}` : null);

	return (
		<div className="group flex gap-3 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/70">
			{iconName && !imgError ? (
				<div className="flex size-10 shrink-0 items-center justify-center">
					<img
						src={wynnItemGuideUrl(iconName)}
						alt={name}
						className="size-10 object-contain"
						loading="lazy"
						onError={() => setImgError(true)}
					/>
				</div>
			) : (
				<div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted/60 text-xs text-muted-foreground">
					?
				</div>
			)}

			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-start justify-between gap-2">
					<span className={cn("font-medium text-sm leading-tight truncate", nameColor)}>
						{name}
					</span>
					{badgeClass && label && (
						<Badge
							variant="outline"
							className={cn("shrink-0 text-[10px] capitalize", badgeClass)}
						>
							{label}
						</Badge>
					)}
				</div>

				<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
					<span className="capitalize">{formatType(item.type, item.subType)}</span>
					{item.requirements?.level != null && (
						<span>Lv. {item.requirements.level}</span>
					)}
				</div>

				{item.attackSpeed && (
					<span className="text-[10px] text-muted-foreground/70 capitalize">
						{item.attackSpeed.replace(/([A-Z])/g, " $1").trim()}
					</span>
				)}
			</div>
		</div>
	);
}
