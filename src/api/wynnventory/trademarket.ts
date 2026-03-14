/**
 * Wynnventory Trademarket API client
 * Base: https://www.wynnventory.com/api/trademarket
 */

import { base, fetchJson, toQueryString } from "./fetch";
import type {
	TradeListingsResponse,
	TradeListingsParams,
	TradePriceInfo,
	TradePriceParams,
	TradeHistoricAverage,
	TradeHistoryParams,
	TradeHistoricDay,
	TradeRankingEntry,
	TradeRankingParams,
} from "@/types/wynnventory/trademarket";

const BASE = base("trademarket");

function qs(
	params?: Record<string, string | number | boolean | null | undefined>,
): string {
	if (!params) return "";
	return toQueryString(params);
}

/** GET /listings — live trade listings (paginated, filterable) */
export async function getTradeListings(
	params?: TradeListingsParams,
): Promise<TradeListingsResponse> {
	return fetchJson<TradeListingsResponse>(
		`${BASE}/listings${qs(params && { ...params })}`,
	);
}

/** GET /listings/:item_name — live listings for a specific item */
export async function getTradeListingsForItem(
	itemName: string,
	params?: TradeListingsParams,
): Promise<TradeListingsResponse> {
	return fetchJson<TradeListingsResponse>(
		`${BASE}/listings/${encodeURIComponent(itemName)}${qs(params && { ...params })}`,
	);
}

/** GET /item/:item_name/price — 7-day price information */
export async function getTradePriceInfo(
	itemName: string,
	params?: TradePriceParams,
): Promise<TradePriceInfo> {
	return fetchJson<TradePriceInfo>(
		`${BASE}/item/${encodeURIComponent(itemName)}/price${qs(params && { ...params })}`,
	);
}

/** GET /history/:item_name/price — historic average price over a date range */
export async function getTradeHistoricAverage(
	itemName: string,
	params?: TradeHistoryParams,
): Promise<TradeHistoricAverage> {
	return fetchJson<TradeHistoricAverage>(
		`${BASE}/history/${encodeURIComponent(itemName)}/price${qs(params && { ...params })}`,
	);
}

/** GET /history/:item_name — historic daily price averages */
export async function getTradeHistoricDays(
	itemName: string,
	params?: TradeHistoryParams,
): Promise<TradeHistoricDay[]> {
	return fetchJson<TradeHistoricDay[]>(
		`${BASE}/history/${encodeURIComponent(itemName)}${qs(params && { ...params })}`,
	);
}

/** GET /ranking — price ranking over a date range */
export async function getTradeRanking(
	params?: TradeRankingParams,
): Promise<TradeRankingEntry[]> {
	return fetchJson<TradeRankingEntry[]>(
		`${BASE}/ranking${qs(params && { ...params })}`,
	);
}
