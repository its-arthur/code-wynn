import type { WynnventoryIcon } from "./common";
import type { ItemEntry } from "@/types/item";

/** Merged item data from both Wynncraft and Wynnventory APIs */
export interface CompletedData<T> {
	wynn: ItemEntry | undefined;
	wynnInv: T;
}

export interface StatRoll {
	displayName?: string;
	apiName?: string;
	statActualValue?: { value: number };
	statRange?: { low: number; high: number };
	statRoll?: number;
	unit?: string;
	rollPercentage?: number | string;
	stars?: number;
}

export interface TradeListing {
	amount: number;
	hash_code: number;
	icon?: WynnventoryIcon | null;
	item_type: string;
	listing_price: number;
	mod_version: string;
	name: string;
	rarity: string;
	shiny_stat: string | null;
	tier: number | null;
	stat_rolls?: StatRoll[];
	timestamp: string;
	overall_roll?: number;
	reroll_count?: number;
	type: string;
	unidentified: boolean;
}

export interface TradeListingsResponse {
	count: number;
	items: TradeListing[];
	page: number;
	page_size: number;
	total: number;
}

export interface TradeListingsParams {
	tier?: number;
	shiny?: boolean;
	unidentified?: boolean;
	rarity?: string;
	itemType?: string;
	page?: number;
	page_size?: number;
}

export interface TradePriceInfo {
	_id: null;
	average_mid_80_percent_price: number;
	average_price: number;
	highest_price: number;
	lowest_price: number;
	name: string;
	tier: number | null;
	total_count: number;
	unidentified_average_mid_80_percent_price: number;
	unidentified_average_price: number;
	unidentified_count: number;
}

export interface TradePriceParams {
	shiny?: boolean;
	tier?: number;
}

export interface TradeHistoricAverage {
	average_mid_80_percent_price: number;
	average_price: number;
	document_count: number;
	highest_price: number;
	lowest_price: number;
	name: string;
	tier: number | null;
	total_count: number;
	unidentified_average_mid_80_percent_price: number;
	unidentified_average_price: number;
	unidentified_count: number;
}

export interface TradeHistoryParams {
	shiny?: boolean;
	tier?: number;
	start_date?: string;
	end_date?: string;
}

export interface TradeHistoricDay {
	average_mid_80_percent_price: number;
	average_price: number;
	date: string;
	highest_price: number;
	item_type: string;
	lowest_price: number;
	timestamp: string;
	name: string;
	shiny_stat: string | null;
	tier: number | null;
	total_count: number;
	unidentified_average_mid_80_percent_price: number;
	unidentified_average_price: number;
	unidentified_count: number;
}

export interface TradeRankingEntry {
	average_mid_80_percent_price: number;
	average_price: number;
	average_total_count: number;
	average_unidentified_count: number;
	highest_price: number;
	lowest_price: number;
	tier: number | null;
	name: string;
	rank: number;
	total_count: number;
	unidentified_average_mid_80_percent_price: number;
	unidentified_count: number;
}

export interface TradeRankingParams {
	start_date?: string;
	end_date?: string;
}

/** Popular tab: merged ranking entry with Wynncraft item metadata */
export interface MergedPopularEntry {
	name: string;
	tier: number | null;
	completedData: CompletedData<TradeRankingEntry>;
}

/** Wynnventory data for a newly listed item */
export interface NewlyListedWynnInv {
	listing: TradeListing;
	listing_price: number;
	timestamp: string;
}

/** Newly listed tab: merged listing entry with Wynncraft item metadata */
export interface MergedNewlyListedEntry {
	name: string;
	tier: number | null;
	completedData: CompletedData<NewlyListedWynnInv>;
}
