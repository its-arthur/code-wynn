"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WynnventoryItem } from "@/types/wynnventory/common";

const RARITY_COLORS: Record<string, string> = {
	common: "text-gray-400",
	unique: "text-yellow-300",
	rare: "text-pink-400",
	legendary: "text-cyan-300",
	fabled: "text-red-400",
	mythic: "text-purple-400",
};

const RARITY_BADGE: Record<string, string> = {
	common: "bg-gray-700/60 text-gray-300 border-gray-600",
	unique: "bg-yellow-900/40 text-yellow-300 border-yellow-700/60",
	rare: "bg-pink-900/40 text-pink-300 border-pink-700/60",
	legendary: "bg-cyan-900/40 text-cyan-200 border-cyan-700/60",
	fabled: "bg-red-900/40 text-red-300 border-red-700/60",
	mythic: "bg-purple-900/40 text-purple-300 border-purple-700/60",
};

export function RaidItem({ item }: { item: WynnventoryItem }) {
	const rarity = item.rarity.toLowerCase();
	const nameColor = RARITY_COLORS[rarity] ?? "text-foreground";
	const badgeClass = RARITY_BADGE[rarity] ?? RARITY_BADGE.common;

	return (
		<div className="flex items-center gap-2.5 rounded-md border border-border/40 bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/60">
			{item.shiny && <Sparkles className="size-3.5 shrink-0 text-yellow-400" />}

			{item.amount > 1 && (
				<span className="text-xs font-medium text-muted-foreground tabular-nums">
					{item.amount}x
				</span>
			)}

			<span className={cn("text-sm font-medium truncate", nameColor)}>
				{item.name}
			</span>

			<Badge
				variant="outline"
				className={cn("ml-auto shrink-0 text-[10px] capitalize", badgeClass)}
			>
				{rarity}
			</Badge>
		</div>
	);
}
