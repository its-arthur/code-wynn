/**
 * Wynnventory Lootpool API client
 * Base: https://www.wynnventory.com/api/lootpool
 */

import { base, fetchJson, toQueryString } from "./fetch";
import type {
	LootrunRewardsResponse,
	LootrunGroupedRegion,
	LootrunHistoryResponse,
} from "@/types/wynnventory/lootpool";

const BASE = base("lootpool");

/** GET /current — current week lootrun rewards */
export async function getLootrunRewardsCurrent(): Promise<LootrunRewardsResponse> {
	return fetchJson<LootrunRewardsResponse>(`${BASE}/current`);
}

/** GET /items — current week rewards grouped by rarity */
export async function getLootrunRewardsGrouped(): Promise<
	LootrunGroupedRegion[]
> {
	return fetchJson<LootrunGroupedRegion[]>(`${BASE}/items`);
}

/** GET /:year/:week — lootrun rewards for a specific week */
export async function getLootrunRewardsForWeek(
	year: number,
	week: number,
): Promise<LootrunRewardsResponse> {
	return fetchJson<LootrunRewardsResponse>(`${BASE}/${year}/${week}`);
}

/** GET /all — paginated lootrun reward history */
export async function getLootrunRewardsHistory(
	page?: number,
	pageSize?: number,
): Promise<LootrunHistoryResponse> {
	const qs = toQueryString({ page, page_size: pageSize });
	return fetchJson<LootrunHistoryResponse>(`${BASE}/all${qs}`);
}
