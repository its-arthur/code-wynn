/**
 * Wynncraft Ability & Aspects API client
 * Base: https://api.wynncraft.com/v3/ability
 * Uses same-origin proxy in browser to avoid CORS.
 * @see https://docs.wynncraft.com/docs/modules/ability.html
 * @see API Markup parser for description/HTML: span, font-* classes, etc.
 */

import type {
	AbilityTreeResponse,
	AbilityMapResponse,
	AbilityMapPlayerResponse,
} from "@/types/ability";

/** Use same-origin proxy in browser to avoid CORS; call Wynncraft directly on server. */
const BASE =
	typeof window !== "undefined"
		? "/api/wynn/ability"
		: "https://api.wynncraft.com/v3/ability";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const apiKey =
		process.env.WYNN_API_KEY ?? process.env.NEXT_PUBLIC_WYNN_API_KEY;
	const res = await fetch(url, {
		...init,
		headers: {
			Accept: "application/json",
			...(apiKey &&
				url.startsWith("http") && { Authorization: `Bearer ${apiKey}` }),
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
export type AbilityClass = string;

/**
 * GET Ability tree for a class (1 hour TTL).
 * Response uses API Markup (HTML with <span>, font-* classes).
 * @param className - e.g. "mage"
 */
export async function getAbilityTree(
	className: AbilityClass,
): Promise<AbilityTreeResponse> {
	const url = `${BASE}/tree/${encodeURIComponent(className)}`;
	return fetchJson<AbilityTreeResponse>(url);
}

/**
 * GET Ability map for a class (1 hour TTL).
 * Returns normal map (record of page -> entries). For player map shape use player character ability map.
 * @param className - e.g. "mage"
 */
export async function getAbilityMap(
	className: AbilityClass,
): Promise<AbilityMapResponse | AbilityMapPlayerResponse> {
	const url = `${BASE}/map/${encodeURIComponent(className)}`;
	return fetchJson<AbilityMapResponse | AbilityMapPlayerResponse>(url);
}
