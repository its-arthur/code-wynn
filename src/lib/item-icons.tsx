import { ItemEntry } from "@/types/item";
import { wynnItemGuideUrl, wynnTomeIconUrl } from "@/lib/wynn-cdn";
import { cn } from "@/lib/utils";
import { useState } from "react";

const MC_HEADS_BASE = "https://mc-heads.net/head";

/** Rune name → local icon path (e.g. "Nii Rune" → /rune/nii_rune.png) */
const RUNE_ICONS: Record<string, string> = {
	nii: "/rune/nii_rune.png",
	uth: "/rune/uth_rune.png",
	tol: "/rune/tol_rune.png",
	az: "/rune/az_rune.png",
};

const KEY_ICON = "/key.png";

/** Emerald subType → icon from /currentcy */
const EMERALD_ICONS: Record<string, string> = {
	emerald: "/currentcy/em.webp",
	emeraldpouch: "/currentcy/em.webp", // pouch uses emerald icon or we could add one
	block: "/currentcy/eb.webp",
	liquid: "/currentcy/le.webp",
	stacks: "/currentcy/stk.webp",
};

function getEmeraldIconPath(item: ItemEntry | string): string | null {
	if (typeof item === "string") {
		const n = item.toLowerCase().replace(/\s/g, "");
		if (!n.includes("emerald")) return null;
		if (n.includes("stacks") || n.includes("stk")) return EMERALD_ICONS.stacks;
		if (n.includes("liquid") || n.includes("le")) return EMERALD_ICONS.liquid;
		if (n.includes("block") || n.includes("eb")) return EMERALD_ICONS.block;
		if (n.includes("pouch")) return EMERALD_ICONS.emeraldpouch;
		return EMERALD_ICONS.emerald;
	}
	// ItemEntry with type Other and subType (Emeraldpouch, Emerald, Block, Liquid, Stacks)
	const type = item.type?.toLowerCase() ?? "";
	const subType = item.subType?.toLowerCase() ?? "";
	if (type !== "other") return null;
	// Map subType to icon key
	if (subType === "stacks") return EMERALD_ICONS.stacks;
	if (subType === "liquid") return EMERALD_ICONS.liquid;
	if (subType === "block") return EMERALD_ICONS.block;
	if (subType === "emeraldpouch") return EMERALD_ICONS.emeraldpouch;
	if (subType === "emerald") return EMERALD_ICONS.emerald;
	return EMERALD_ICONS.emerald; // default
}

function isEmeraldItem(item: ItemEntry | string): boolean {
	if (typeof item === "string") {
		return item.toLowerCase().includes("emerald");
	}
	return (
		item.type?.toLowerCase() === "other" &&
		(item.subType?.toLowerCase()?.includes("emerald") ||
			item.subType?.toLowerCase() === "block" ||
			item.subType?.toLowerCase() === "liquid" ||
			item.subType?.toLowerCase() === "stacks")
	);
}

/** Powder name → local icon path (e.g. "Fire Powder I" → /powder/120px-FirePowder.png) */
const POWDER_ICONS: Record<string, string> = {
	fire: "/powder/120px-FirePowder.png",
	water: "/powder/120px-WaterPowder.png",
	air: "/powder/120px-AirPowder.png",
	thunder: "/powder/120px-ThunderPowder.png",
	earth: "/powder/120px-EarthPowder.png",
};

/** Corkian name → local icon path (e.g. "Corkian Amplifier I" → /corkian/CorkianAmplifier.webp) */
const CORKIAN_ICONS: Record<string, string> = {
	amplifier: "/corkian/CorkianAmplifier.webp",
	insulator: "/corkian/CorkianInsulator.webp",
	simulator: "/corkian/CorkianSimulator.webp",
};

function getRuneIconPath(name: string): string | null {
	if (!name.toLowerCase().includes("rune")) return null;
	const slug = name.toLowerCase().split(/\s+/)[0];
	return RUNE_ICONS[slug] ?? null;
}

function getPowderIconPath(name: string): string | null {
	const slug = name.toLowerCase().split(/\s+/)[0];
	return POWDER_ICONS[slug] ?? null;
}

function getCorkianIconPath(name: string): string | null {
	if (!name.toLowerCase().includes("corkian")) return null;
	const parts = name.toLowerCase().split(/\s+/);
	for (const p of parts) {
		const path = CORKIAN_ICONS[p];
		if (path) return path;
	}
	return null;
}

/** Tome API subType → CDN slug (tome.{slug}.webp) */
const TOME_SUBTYPE_MAP: Record<string, string> = {
	allegiance: "guild",
	combat: "weapon",
	marathon: "movement",
	expertise: "utility",
	expertis: "utility",
	syndicate: "lootrun",
	defensive: "armour",
	guild: "guild",
	weapon: "weapon",
	movement: "movement",
	utility: "utility",
	lootrun: "lootrun",
	armour: "armour",
};

function getTomeIconSlug(subtype: string): string {
	const key = (subtype ?? "").trim().toLowerCase().replace(/\s+/g, "_");
	// Match by include (e.g. "allegiance_tome_i" includes "allegiance" → guild)
	for (const [mapKey, slug] of Object.entries(TOME_SUBTYPE_MAP)) {
		if (key.includes(mapKey)) return slug;
	}
	return "guild";
}

function isTomeItem(item: ItemEntry | string): boolean {
	if (typeof item === "string") return item.toLowerCase().includes("tome");
	return (item.internalName ?? "").toLowerCase().includes("tome");
}

function getTomeSubtypeFromName(name: string): string | null {
	if (!(name ?? "").toLowerCase().includes("tome")) return null;
	return getTomeIconSlug(name);
}

function isKeyItem(name: string, type?: string, subType?: string): boolean {
	const n = name.toLowerCase();
	const t = type?.toLowerCase() ?? "";
	const s = subType?.toLowerCase() ?? "";
	return (
		n.includes("key") ||
		t === "key" ||
		s === "key" ||
		t.includes("key") ||
		s.includes("key")
	);
}

function getItemIconUrl(item: ItemEntry | string): string | null {
	if (typeof item === "string") {
		const runePath = getRuneIconPath(item);
		if (runePath) return runePath;
		const powderPath = getPowderIconPath(item);
		if (powderPath) return powderPath;
		const corkianPath = getCorkianIconPath(item);
		if (corkianPath) return corkianPath;
		if (isKeyItem(item)) return KEY_ICON;
		const emeraldPath = getEmeraldIconPath(item);
		if (emeraldPath) return emeraldPath;
		const tomeSlug = getTomeSubtypeFromName(item);
		if (tomeSlug !== null) return wynnTomeIconUrl(tomeSlug);
		return wynnItemGuideUrl(item);
	}

	// Rune type (mock or real) – use local rune icons by name
	if (
		item.type?.toLowerCase() === "rune" ||
		item.subType?.toLowerCase() === "rune"
	) {
		const runePath = getRuneIconPath(item.internalName ?? "");
		if (runePath) return runePath;
	}

	// Powder type (enchanter) – use local powder icons by name
	if (
		item.type?.toLowerCase() === "enchanter" &&
		item.subType?.toLowerCase() === "powder"
	) {
		const powderPath = getPowderIconPath(item.internalName ?? "");
		if (powderPath) return powderPath;
	}

	// Corkian type (enchanter) – use local corkian icons by name
	if (
		item.type?.toLowerCase() === "enchanter" &&
		item.subType?.toLowerCase() === "corkian"
	) {
		const corkianPath = getCorkianIconPath(item.internalName ?? "");
		if (corkianPath) return corkianPath;
	}

	// Key type – use local key icon for all keys
	if (isKeyItem(item.internalName ?? "", item.type, item.subType)) {
		return KEY_ICON;
	}

	// Emerald type (Other + Emeraldpouch/Emerald/Block/Liquid/Stacks)
	if (isEmeraldItem(item)) {
		return getEmeraldIconPath(item);
	}

	// Tome type – CDN tome.{slug}.webp (Allegiance→guild, Combat→weapon, etc.)
	if (isTomeItem(item)) {
		const slug = item.subType
			? getTomeIconSlug(item.subType)
			: (getTomeSubtypeFromName(item.internalName ?? "") ?? "guild");
		return wynnTomeIconUrl(slug);
	}

	if (!item.icon?.value) return null;

	const rawName =
		typeof item.icon.value === "object"
			? (item.icon.value?.name ?? "")
			: String(item.icon.value);

	if (!rawName.trim()) return null;

	if (item.type === "material") {
		return wynnItemGuideUrl(rawName);
	}

	if (item.type === "armour" && item.icon.format !== "skin") {
		if (item.armourMaterial?.includes("_")) {
			const material = item.armourMaterial?.split("_")[1];
			return wynnItemGuideUrl(`${material}_${item.armourType}`);
		}
		return wynnItemGuideUrl(`${item.armourMaterial}_${item.armourType}`);
	}

	if (item.icon.format === "skin") {
		const skinId =
			typeof item.icon.value === "object"
				? (item.icon.value?.id ?? item.icon.value?.name ?? "")
				: String(item.icon.value);
		return skinId.trim() ? `${MC_HEADS_BASE}/${skinId}` : null;
	}

	if (item.icon.format === "attribute" || item.icon.format === "legacy") {
		const iconValue =
			typeof item.icon.value === "object"
				? item.icon.value.name
				: item.icon.value.replace(":", "_");

		return wynnItemGuideUrl(iconValue);
	}

	return wynnItemGuideUrl(rawName);
}

function ItemIcon({
	item,
	alt,
	className,
}: {
	item: ItemEntry | string;
	alt?: string;
	className?: string;
}) {
	const [imgError, setImgError] = useState(false);
	const url = getItemIconUrl(item);

	const imgClass = cn("shrink-0 object-contain", className ?? "size-8");
	if (imgError) {
		return (
			<img
				src="/wynn.webp"
				alt={alt ?? ""}
				className={imgClass}
				loading="lazy"
			/>
		);
	}
	return (
		<img
			src={url || "/wynn.webp"}
			alt={alt ?? ""}
			className={imgClass}
			loading="lazy"
			onError={() => setImgError(true)}
		/>
	);
}

export { getItemIconUrl, ItemIcon };
