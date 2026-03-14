"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RaidItem } from "./raid-item";
import type { WynnventoryItem } from "@/types/wynnventory/common";
import type { LootItemGroup } from "@/types/wynnventory/common";

interface RegionCardProps {
	region: string;
	timestamp?: string;
	items?: WynnventoryItem[];
	groups?: LootItemGroup[];
}

const RARITY_ORDER = ["mythic", "fabled", "legendary", "rare", "unique", "common"];

function sortByRarity(items: WynnventoryItem[]): WynnventoryItem[] {
	return [...items].sort((a, b) => {
		const ai = RARITY_ORDER.indexOf(a.rarity.toLowerCase());
		const bi = RARITY_ORDER.indexOf(b.rarity.toLowerCase());
		return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
	});
}

export function RegionCard({
	region,
	timestamp,
	items,
	groups,
}: RegionCardProps) {
	const [open, setOpen] = useState(true);

	return (
		<div className="rounded-lg border border-border/50 bg-card">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center justify-between px-4 py-3 text-left"
			>
				<div>
					<h3 className="font-semibold text-sm">{region}</h3>
					{timestamp && (
						<p className="text-[11px] text-muted-foreground">{timestamp}</p>
					)}
				</div>
				<ChevronDown
					className={cn(
						"size-4 text-muted-foreground transition-transform",
						open && "rotate-180",
					)}
				/>
			</button>

			{open && (
				<div className="border-t border-border/30 px-4 pb-4 pt-3">
					{items && (
						<div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
							{sortByRarity(items).map((item, i) => (
								<RaidItem key={`${item.name}-${i}`} item={item} />
							))}
						</div>
					)}

					{groups && (
						<div className="space-y-4">
							{groups.map((group) => (
								<div key={group.group}>
									<h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
										{group.group}
									</h4>
									<div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
										{group.loot_items.map((item, i) => (
											<RaidItem
												key={`${item.name}-${i}`}
												item={{
													...item,
													shinyStat: null,
													subtype: item.type ?? "",
												}}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
