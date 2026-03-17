/**
 * Aspects API types from Wynncraft API v3.
 * GET https://api.wynncraft.com/v3/aspects/{tree}
 * Descriptions use API Markup (HTML with span, font-* classes).
 * @see https://docs.wynncraft.com/docs/modules/ability.html#aspects-list
 */

export interface AspectIconValue {
	id: string;
	name: string;
	customModelData?: number | { rangeDispatch?: number[] };
}

export interface AspectIcon {
	value: AspectIconValue | string;
	format: string;
}

export interface AspectTier {
	threshold: number;
	description: string[];
}

export interface AspectEntry {
	name: string;
	icon: AspectIcon;
	rarity: string;
	requiredClass: string;
	tiers: Record<string, AspectTier>;
}

/** GET /v3/aspects/:tree - aspect name → aspect data (1 hour TTL) */
export type AspectsResponse = Record<string, AspectEntry>;
