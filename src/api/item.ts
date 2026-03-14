/**
 * Wynncraft Item API client
 * Base: https://api.wynncraft.com/v3/item
 * @see https://docs.wynncraft.com/docs/modules/item.html
 */

import type {
	ItemDatabase,
	ItemDatabasePaginated,
	ItemSearchBody,
	ItemMetadata,
} from "@/types/item";

const BASE =
	typeof window !== "undefined"
		? "/api/wynn/item"
		: "https://api.wynncraft.com/v3/item";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const apiKey =
		process.env.WYNN_API_KEY ?? process.env.NEXT_PUBLIC_WYNN_API_KEY;
	const res = await fetch(url, {
		...init,
		headers: {
			Accept: "application/json",
			...(apiKey &&
				url.startsWith("http") && {
					Authorization: `Bearer ${apiKey}`,
				}),
			...init?.headers,
		},
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Wynncraft API ${res.status}: ${text || res.statusText}`);
	}
	return res.json() as Promise<T>;
}

/**
 * GET Item database – paginated (1 hour TTL)
 * @param page - page number (starts at 1)
 */
export async function getItemDatabasePaginated(
	page?: number,
): Promise<ItemDatabasePaginated> {
	const qs = page != null ? `?page=${page}` : "";
	return fetchJson<ItemDatabasePaginated>(`${BASE}/database${qs}`);
}

/**
 * GET Item database – full result, bypasses pagination (1 hour TTL)
 */
export async function getItemDatabaseFull(): Promise<ItemDatabase> {
	return fetchJson<ItemDatabase>(`${BASE}/database?fullResult`);
}

/**
 * POST Item search
 * @param body - search filters (query, type, tier, attackSpeed, etc.)
 * @param fullResult - if true, bypass pagination and return only results
 */
export async function searchItems(
	body: ItemSearchBody,
	fullResult?: boolean,
): Promise<ItemDatabasePaginated | ItemDatabase> {
	const qs = fullResult ? "?fullResult" : "";
	return fetchJson<ItemDatabasePaginated | ItemDatabase>(
		`${BASE}/search${qs}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		},
	);
}

/**
 * GET Item quick search (1 minute TTL)
 * @param query - search query string
 */
export async function quickSearchItems(query: string): Promise<ItemDatabase> {
	return fetchJson<ItemDatabase>(
		`${BASE}/search/${encodeURIComponent(query)}`,
	);
}

/**
 * GET Item metadata – available filters, identifications, major IDs (1 hour TTL)
 */
export async function getItemMetadata(): Promise<ItemMetadata> {
	return fetchJson<ItemMetadata>(`${BASE}/metadata`);
}
