"use client";

import { create } from "zustand";
import {
	getTradeRanking,
	getTradeListings,
} from "@/api/wynnventory/trademarket";
import { getItemDatabaseFull } from "@/api/item";
import type {
	TradeRankingEntry,
	TradeListing,
} from "@/types/wynnventory/trademarket";
import type { ItemDatabase } from "@/types/item";

export interface NewlyListedEntry {
	name: string;
	tier: number | null;
	listing_price: number;
	timestamp: string;
	listing: TradeListing;
}

interface TradeMarketState {
	ranking: TradeRankingEntry[];
	listings: NewlyListedEntry[];
	itemDb: ItemDatabase;
	loading: boolean;
	loadingListings: boolean;
	error: string | null;
	fetchedAt: number | null;
	listingsFetchedAt: number | null;
}

interface TradeMarketActions {
	fetch: (force?: boolean) => Promise<void>;
	fetchListings: (force?: boolean) => Promise<void>;
	refreshInBackground: () => Promise<void>;
}

const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute
const LISTINGS_PAGE_SIZE = 500;

function processListingsToNewlyListed(items: TradeListing[]): NewlyListedEntry[] {
	const byKey = new Map<string, TradeListing>();
	for (const l of items) {
		const key = `${l.name}__${l.tier ?? "null"}`;
		const existing = byKey.get(key);
		if (
			!existing ||
			new Date(l.timestamp).getTime() > new Date(existing.timestamp).getTime()
		) {
			byKey.set(key, l);
		}
	}
	return Array.from(byKey.values())
		.filter((l) => l.listing_price > 1)
		.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		)
		.map((l) => ({
			name: l.name,
			tier: l.tier,
			listing_price: l.listing_price,
			timestamp: l.timestamp,
			listing: l,
		}));
}

async function fetchRankingAndDb() {
	const [rankData, dbData] = await Promise.all([
		getTradeRanking(),
		getItemDatabaseFull(),
	]);
	return { rankData, dbData };
}

export const useTradeMarketStore = create<TradeMarketState & TradeMarketActions>(
	(set, get) => ({
		ranking: [],
		listings: [],
		itemDb: {},
		loading: true,
		loadingListings: false,
		error: null,
		fetchedAt: null,
		listingsFetchedAt: null,

		fetch: async (force = false) => {
			const { fetchedAt } = get();
			const hasCache = get().ranking.length > 0 || Object.keys(get().itemDb).length > 0;
			const cacheValid =
				fetchedAt != null && Date.now() - fetchedAt < REFRESH_INTERVAL_MS;

			if (!force && hasCache) {
				set({ loading: false, error: null });
				if (!cacheValid) {
					get().refreshInBackground();
				}
				return;
			}

			set({ loading: true, error: null });
			try {
				const { rankData, dbData } = await fetchRankingAndDb();
				set({
					ranking: rankData,
					itemDb: dbData,
					loading: false,
					error: null,
					fetchedAt: Date.now(),
				});
			} catch (e) {
				set({
					loading: false,
					error: e instanceof Error ? e.message : "Failed to load",
				});
			}
		},

		fetchListings: async (force = false) => {
			const { listingsFetchedAt } = get();
			const hasCache = get().listings.length > 0;
			const cacheValid =
				listingsFetchedAt != null &&
				Date.now() - listingsFetchedAt < REFRESH_INTERVAL_MS;

			if (!force && hasCache && cacheValid) {
				return;
			}

			set({ loadingListings: true });
			try {
				const res = await getTradeListings({
					page: 1,
					page_size: LISTINGS_PAGE_SIZE,
				});
				const processed = processListingsToNewlyListed(res.items);
				set({
					listings: processed,
					loadingListings: false,
					listingsFetchedAt: Date.now(),
				});
			} catch {
				set({ loadingListings: false });
			}
		},

		refreshInBackground: async () => {
			try {
				const { rankData, dbData } = await fetchRankingAndDb();
				set({
					ranking: rankData,
					itemDb: dbData,
					error: null,
					fetchedAt: Date.now(),
				});
			} catch {
				// Keep existing cache on background refresh failure
			}
		},
	}),
);
