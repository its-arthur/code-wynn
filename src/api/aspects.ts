/**
 * Wynncraft Aspects API client
 * Base: https://api.wynncraft.com/v3/aspects
 * @see https://docs.wynncraft.com/docs/modules/ability.html#aspects-list
 */

import type { AspectsResponse } from "@/types/aspects";

const BASE =
	typeof window !== "undefined"
		? "/api/wynn/aspects"
		: "https://api.wynncraft.com/v3/aspects";

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

/** Class identifier (e.g. mage, warrior, archer, assassin, shaman). */
export type AspectTree = string;

/**
 * GET Aspects list for a class (1 hour TTL).
 * Returns aspect name → aspect data. Descriptions use API Markup (HTML).
 * @param tree - class name, e.g. "mage"
 */
export async function getAspects(tree: AspectTree): Promise<AspectsResponse> {
	const url = `${BASE}/${encodeURIComponent(tree)}`;
	return fetchJson<AspectsResponse>(url);
}
