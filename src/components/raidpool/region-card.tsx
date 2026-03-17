"use client";

import { resolveWynnData } from "@/lib/resolve-wynn-item";
import { RaidItem } from "./raid-item";
import type { ItemEntry } from "@/types/item";
import type { WynnventoryItem } from "@/types/wynnventory/common";
import type { LootItemGroup } from "@/types/wynnventory/common";

export interface CompletedData {
	wynn: ItemEntry | undefined;
	wynnInv: WynnventoryItem;
}

interface RegionCardProps {
	region: string;
	timestamp?: string;
	items?: WynnventoryItem[];
	groups?: LootItemGroup[];
	itemDb?: Record<string, ItemEntry>;
	onItemClick?: (name: string) => void;
}

const RARITY_ORDER = [
	"mythic",
	"fabled",
	"legendary",
	"rare",
	"unique",
	"common",
];

function sortByRarity(items: WynnventoryItem[]): WynnventoryItem[] {
	return [...items].sort((a, b) => {
		const ai = RARITY_ORDER.indexOf(a.rarity.toLowerCase());
		const bi = RARITY_ORDER.indexOf(b.rarity.toLowerCase());
		return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
	});
}

function toWynnInv(item: {
	itemType?: string;
	type?: string;
	rarity?: string;
}): { item_type?: string; type?: string; rarity?: string } {
	const type = item.itemType ?? item.type ?? "";
	return {
		item_type: type,
		type,
		rarity: item.rarity,
	};
}

export function RegionCard({
	region,
	timestamp,
	items,
	groups,
	itemDb,
	onItemClick,
}: RegionCardProps) {
	const toCompletedData = (
		item: WynnventoryItem,
		tier: number | null = null,
	): CompletedData => {
		const wynnInv = toWynnInv(item);
		return {
			wynn: itemDb
				? resolveWynnData(itemDb, item.name, tier, wynnInv)
				: undefined,
			wynnInv: item,
		};
	};

	const toCompletedDataFromGrouped = (
		item: LootItemGroup["loot_items"][number],
	): CompletedData => {
		const normalized: WynnventoryItem = {
			amount: item.amount,
			icon: item.icon,
			itemType: item.itemType,
			name: item.name,
			rarity: item.rarity,
			shiny: item.shiny,
			shinyStat: null,
			subtype: item.type ?? "",
		};
		return toCompletedData(normalized);
	};

	return (
		<div className="rounded-lg border border-border/50 bg-card max-w-4xl mx-auto">
			<div className="px-4 py-3">
				<h3 className="font-semibold text-sm">{region}</h3>
				{timestamp && (
					<p className="text-[11px] text-muted-foreground">{timestamp}</p>
				)}
			</div>

			<div className="border-t border-border/30 px-4 pb-4 pt-3">
				{items && (
					<div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
						{sortByRarity(items).map((item, i) => (
							<RaidItem
								key={`${item.name}-${i}`}
								completedData={toCompletedData(item)}
								onClick={onItemClick ? () => onItemClick(item.name) : undefined}
							/>
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
											completedData={toCompletedDataFromGrouped(item)}
											onClick={onItemClick ? () => onItemClick(item.name) : undefined}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
