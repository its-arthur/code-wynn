/**
 * Item module types from Wynncraft API v3
 * @see https://docs.wynncraft.com/docs/modules/item.html
 */

export interface ItemIcon {
	format: string;
	value:
		| string
		| {
				id: string;
				name: string;
				customModelData?: string | { rangeDispatch?: number[] };
		  };
}

export interface ItemDamageRange {
	min: number;
	max: number;
	raw?: number;
}

export interface ItemBase {
	baseDamage?: ItemDamageRange;
	baseHealth?: number;
	[key: string]: ItemDamageRange | number | undefined;
}

export interface ItemRequirements {
	level?: number;
	levelRange?: { min: number; max: number };
	strength?: number;
	dexterity?: number;
	intelligence?: number;
	defence?: number;
	agility?: number;
	quest?: string;
	class_requirement?: string;
	skills?: string[];
}

export interface ItemDropMeta {
	coordinates: [number, number, number];
	name: string;
	type: string;
}

export interface ItemConsumableOnlyIDs {
	duration: number;
	charges: number;
}

export interface ItemIngredientPositionModifiers {
	left: number;
	right: number;
	above: number;
	under: number;
	touching: number;
	not_touching: number;
}

export interface ItemIngredientOnlyIDs {
	durability_modifier: number;
	strength_requirement: number;
	dexterity_requirement: number;
	intelligence_requirement: number;
	defence_requirement: number;
	agility_requirement: number;
}

export interface ItemIdentification {
	min: number;
	max: number;
	raw: number;
}

export interface ItemEntry {
	internalName: string;
	type: string;
	subType?: string;
	icon?: ItemIcon;
	identified?: boolean;
	identifier?: boolean;
	allow_craftsman?: boolean;

	armourType?: string;
	armourMaterial?: string;
	attackSpeed?: string;
	averageDPS?: number;
	gatheringSpeed?: number;
	tier?: string | number;
	rarity?: string;

	consumableOnlyIDs?: ItemConsumableOnlyIDs;
	ingredientPositionModifiers?: ItemIngredientPositionModifiers;
	itemOnlyIDs?: ItemIngredientOnlyIDs;

	majorIds?: Record<string, string>;
	craftable?: string[];

	powderSlots?: number;
	lore?: string;
	dropRestriction?: string;
	restriction?: string;
	raidReward?: boolean;
	dropMeta?: ItemDropMeta;

	base?: ItemBase;
	requirements?: ItemRequirements;
	identifications?: Record<string, number | ItemIdentification>;
}

/** Map of item name → item data (used by fullResult and quick search) */
export type ItemDatabase = Record<string, ItemEntry>;

/** Pagination controller from paginated database endpoint */
export interface ItemPaginationController {
	count: number;
	current_count: number;
	pages: number;
	prev: number | null;
	current: number;
	next: number | null;
}

/** Paginated database response: GET /v3/item/database */
export interface ItemDatabasePaginated {
	controller: ItemPaginationController;
	results: ItemDatabase;
}

/** POST /v3/item/search request body */
export interface ItemSearchBody {
	query?: string[];
	type?: string | string[];
	tier?: number | string | (number | string)[];
	attackSpeed?: string | string[];
	levelRange?: number | number[];
	professions?: string | string[];
	identifications?: string | string[];
	majorIds?: string | string[];
}

/** GET /v3/item/metadata response */
export interface ItemMetadata {
	filters: {
		type: string[];
		advanced: {
			attackSpeed: string[];
			weapon: string[];
			armour: string[];
			accessory: string[];
			tome: string[];
			tool: string[];
			crafting: string[];
			gathering: string[];
		};
		tier: {
			items: string[];
			ingredients: number[];
		};
		identifications: string[];
		levelRange: {
			items: number;
			ingredients: number;
		};
	};
	majorIds: string[];
	static: Record<string, number>;
}
