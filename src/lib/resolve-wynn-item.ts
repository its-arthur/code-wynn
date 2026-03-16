import type { ItemEntry } from "@/types/item";
import { tierRoman } from "@/lib/utils";

const POWDER_TYPES = ["fire", "water", "air", "thunder", "earth"];
const CORKIAN_TYPES = ["amplifier", "insulator", "simulator"];

export interface WynnInvLike {
	item_type?: string;
	type?: string;
	rarity?: string;
}

/** Look up Wynncraft item by name, trying name + tier variants when tier is set */
function getWynnItem(
	itemDb: Record<string, ItemEntry>,
	name: string,
	tier: number | null,
): ItemEntry | undefined {
	const direct = itemDb[name];
	if (direct) return direct;
	if (tier != null) {
		const withTierNum = itemDb[`${name} ${tier}`];
		if (withTierNum) return withTierNum;
		const withTierRoman = itemDb[`${name} ${tierRoman(tier)}`];
		if (withTierRoman) return withTierRoman;
	}
	return undefined;
}

function getEnchanterSubType(
	name: string,
	wynnInv?: WynnInvLike,
): "rune" | "powder" | "corkian" | null {
	const n = name.toLowerCase();
	const itemType =
		wynnInv?.item_type?.toLowerCase() ?? wynnInv?.type?.toLowerCase() ?? "";

	if (n.includes("rune") || itemType.includes("rune")) return "rune";

	for (const p of POWDER_TYPES) {
		if (n.startsWith(p) || n.includes(` ${p} `) || n === `${p} powder`)
			return "powder";
	}
	if (n.includes("powder") || itemType.includes("powder")) return "powder";

	if (n.includes("corkian")) return "corkian";
	for (const c of CORKIAN_TYPES) {
		if (n.includes(c)) return "corkian";
	}

	return null;
}

function isEnchanterItem(name: string, wynnInv?: WynnInvLike): boolean {
	return getEnchanterSubType(name, wynnInv) != null;
}

function createMockWynnForEnchanterItem(
	name: string,
	tier: number | null,
	wynnInv?: WynnInvLike,
): ItemEntry {
	const subType = getEnchanterSubType(name, wynnInv) ?? "rune";
	const rarity = wynnInv?.rarity ?? "common";
	return {
		internalName: tier != null ? `${name} ${tierRoman(tier)}` : name,
		type: "enchanter",
		subType: subType.charAt(0).toUpperCase() + subType.slice(1),
		rarity,
	};
}

function isKeyItem(name: string, wynnInv?: WynnInvLike): boolean {
	const n = name.toLowerCase();
	const itemType =
		wynnInv?.item_type?.toLowerCase() ?? wynnInv?.type?.toLowerCase() ?? "";
	return n.includes("key") || itemType.includes("key");
}

function createMockWynnForKeyItem(
	name: string,
	tier: number | null,
	wynnInv?: WynnInvLike,
): ItemEntry {
	const rarity = wynnInv?.rarity ?? "common";
	return {
		internalName: tier != null ? `${name} ${tierRoman(tier)}` : name,
		type: "key",
		subType: "Dungeon Key",
		rarity,
	};
}

function isMountItem(name: string, wynnInv?: WynnInvLike): boolean {
	const n = name.toLowerCase();
	const itemType =
		wynnInv?.item_type?.toLowerCase() ?? wynnInv?.type?.toLowerCase() ?? "";
	return (
		n.includes("horse") ||
		n.includes("mount") ||
		itemType.includes("horse") ||
		itemType.includes("mount")
	);
}

function createMockWynnForMountItem(
	name: string,
	tier: number | null,
	wynnInv?: WynnInvLike,
): ItemEntry {
	const rarity = wynnInv?.rarity ?? "common";
	return {
		internalName: tier != null ? `${name} ${tierRoman(tier)}` : name,
		type: "Mounts",
		subType: "Horse",
		rarity,
	};
}

/** Detection keys -> display subType (type is always "Other") */
const EMERALD_SUBTYPE_MAP: Record<string, string> = {
	pouch: "Emeraldpouch",
	emerald: "Emerald",
	single: "Emerald",
	block: "Block",
	liquid: "Liquid",
	stacks: "Stacks",
};

const EMERALD_DETECT_ORDER = [
	"pouch",
	"block",
	"liquid",
	"stacks",
	"emerald",
] as const;

function getEmeraldSubType(name: string, wynnInv?: WynnInvLike): string | null {
	const n = name.toLowerCase().replace(/\s/g, "");
	const itemType =
		wynnInv?.item_type?.toLowerCase() ?? wynnInv?.type?.toLowerCase() ?? "";

	if (!n.includes("emerald") && !itemType.includes("emerald")) return null;

	for (const key of EMERALD_DETECT_ORDER) {
		if (n.includes(key) || itemType.includes(key)) {
			return EMERALD_SUBTYPE_MAP[key] ?? "Emeraldpouch";
		}
	}
	if (
		n.includes("emeraldpouch") ||
		(n.includes("emerald") && n.includes("pouch"))
	)
		return "Emeraldpouch";
	if (
		itemType.includes("emeraldpouch") ||
		(itemType.includes("emerald") && itemType.includes("pouch"))
	)
		return "Emeraldpouch";

	return "Emeraldpouch"; // default for generic emerald
}

function isEmeraldItem(name: string, wynnInv?: WynnInvLike): boolean {
	return getEmeraldSubType(name, wynnInv) != null;
}

function createMockWynnForEmeraldItem(
	name: string,
	tier: number | null,
	wynnInv?: WynnInvLike,
): ItemEntry {
	const subType = getEmeraldSubType(name, wynnInv) ?? "Emeraldpouch";
	const rarity = wynnInv?.rarity ?? "common";
	return {
		internalName: tier != null ? `${name} ${tierRoman(tier)}` : name,
		type: "Other",
		subType,
		rarity,
	};
}

/** Resolve wynn data: real from itemDb, or mock for key/enchanter/mount/other items */
export function resolveWynnData(
	itemDb: Record<string, ItemEntry>,
	name: string,
	tier: number | null,
	wynnInv?: WynnInvLike,
): ItemEntry | undefined {
	const wynn = getWynnItem(itemDb, name, tier);
	if (wynn) return wynn;
	if (isKeyItem(name, wynnInv)) {
		return createMockWynnForKeyItem(name, tier, wynnInv);
	}
	if (isEnchanterItem(name, wynnInv)) {
		return createMockWynnForEnchanterItem(name, tier, wynnInv);
	}
	if (isMountItem(name, wynnInv)) {
		return createMockWynnForMountItem(name, tier, wynnInv);
	}
	if (isEmeraldItem(name, wynnInv)) {
		return createMockWynnForEmeraldItem(name, tier, wynnInv);
	}
	return undefined;
}
