import type { WynnventoryItem, LootItemGroup } from "./common";

export interface RaidRegion {
	items: WynnventoryItem[];
	region: string;
	timestamp: string;
}

export interface RaidRewardsResponse {
	regions: RaidRegion[];
	week: number;
	year: number;
}

export interface RaidGroupedRegion {
	group_items: LootItemGroup[];
	region: string;
	timestamp: string;
	week: number;
	year: number;
}

export interface Gambit {
	color: string;
	description: string[];
	name: string;
	timestamp: string;
}

export interface GambitResponse {
	day: number;
	gambits: Gambit[];
	month: number;
	timestamp: string;
	year: number;
}

export interface RaidHistoryRegion extends RaidRegion {
	type: string;
}

export interface RaidPool {
	regions: RaidHistoryRegion[];
	week: number;
	year: number;
}

export interface RaidHistoryResponse {
	count: number;
	page: number;
	page_size: number;
	pools: RaidPool[];
}
