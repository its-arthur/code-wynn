import type { WynnventoryItem, LootItemGroup } from "./common";

export interface LootrunRegion {
	items: WynnventoryItem[];
	region: string;
	timestamp: string;
}

export interface LootrunRewardsResponse {
	regions: LootrunRegion[];
	week: number;
	year: number;
}

export interface LootrunGroupedRegion {
	region_items: LootItemGroup[];
	region: string;
	timestamp: string;
	week: number;
	year: number;
}

export interface LootrunHistoryRegion extends LootrunRegion {
	type: string;
}

export interface LootrunPool {
	regions: LootrunHistoryRegion[];
	week: number;
	year: number;
}

export interface LootrunHistoryResponse {
	count: number;
	page: number;
	page_size: number;
	pools: LootrunPool[];
}
