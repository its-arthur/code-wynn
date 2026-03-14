/**
 * Wynnventory Raidpool API client
 * Base: https://www.wynnventory.com/api/raidpool
 */

import { base, fetchJson, toQueryString } from "./fetch";
import type {
	RaidRewardsResponse,
	RaidGroupedRegion,
	GambitResponse,
	RaidHistoryResponse,
} from "@/types/wynnventory/raidpool";

const BASE = base("raidpool");

/** GET /current — current week raid rewards */
export async function getRaidRewardsCurrent(): Promise<RaidRewardsResponse> {
	return fetchJson<RaidRewardsResponse>(`${BASE}/current`);
}

/** GET /items — current week rewards grouped by item type */
export async function getRaidRewardsGrouped(): Promise<RaidGroupedRegion[]> {
	return fetchJson<RaidGroupedRegion[]>(`${BASE}/items`);
}

/** GET /:year/:week — raid rewards for a specific week */
export async function getRaidRewardsForWeek(
	year: number,
	week: number,
): Promise<RaidRewardsResponse> {
	return fetchJson<RaidRewardsResponse>(`${BASE}/${year}/${week}`);
}

/** GET /gambits/current — current raid gambits */
export async function getRaidGambitsCurrent(): Promise<GambitResponse> {
	return fetchJson<GambitResponse>(`${BASE}/gambits/current`);
}

/** GET /all — paginated raid reward history */
export async function getRaidRewardsHistory(
	page?: number,
	pageSize?: number,
): Promise<RaidHistoryResponse> {
	const qs = toQueryString({ page, page_size: pageSize });
	return fetchJson<RaidHistoryResponse>(`${BASE}/all${qs}`);
}
