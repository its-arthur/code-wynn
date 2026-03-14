export interface WynnventoryIcon {
	format: string;
	value: string;
}

export interface WynnventoryItem {
	amount: number;
	icon: WynnventoryIcon | null;
	itemType: string;
	name: string;
	rarity: string;
	shiny: boolean;
	shinyStat: string | null;
	subtype: string;
}

export interface GroupedLootItem {
	amount: number;
	icon: WynnventoryIcon | null;
	itemType: string;
	name: string;
	rarity: string;
	shiny: boolean;
	type?: string;
}

export interface LootItemGroup {
	group: string;
	loot_items: GroupedLootItem[];
}
