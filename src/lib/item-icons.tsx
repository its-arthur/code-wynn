import { ItemEntry } from "@/types/item";
import { wynnItemGuideUrl } from "@/lib/wynn-cdn";
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
		return wynnItemGuideUrl(item);
	}

	// Rune type (mock or real) – use local rune icons by name
	if (item.type?.toLowerCase() === "rune" || item.subType?.toLowerCase() === "rune") {
		const runePath = getRuneIconPath(item.internalName ?? "");
		if (runePath) return runePath;
	}

	// Powder type (enchanter) – use local powder icons by name
	if (item.type?.toLowerCase() === "enchanter" && item.subType?.toLowerCase() === "powder") {
		const powderPath = getPowderIconPath(item.internalName ?? "");
		if (powderPath) return powderPath;
	}

	// Corkian type (enchanter) – use local corkian icons by name
	if (item.type?.toLowerCase() === "enchanter" && item.subType?.toLowerCase() === "corkian") {
		const corkianPath = getCorkianIconPath(item.internalName ?? "");
		if (corkianPath) return corkianPath;
	}

	// Key type – use local key icon for all keys
	if (isKeyItem(item.internalName ?? "", item.type, item.subType)) {
		return KEY_ICON;
	}

    if (!item.icon?.value) return null;

    const rawName =
        typeof item.icon.value === "object"
            ? item.icon.value?.name ?? ""
            : String(item.icon.value);

    if (!rawName.trim()) return null;

    if (item.type === "material") {
        return wynnItemGuideUrl(rawName);
    }

    if (item.type === 'armour' && item.icon.format !== 'skin') {
        if (item.armourMaterial?.includes('_')) {
            const material = item.armourMaterial?.split('_')[1];
            return wynnItemGuideUrl(`${material}_${item.armourType}`);
        }
        return wynnItemGuideUrl(`${item.armourMaterial}_${item.armourType}`);
    }

    if (item.icon.format === "skin") {
        const skinId =
            typeof item.icon.value === "object"
                ? item.icon.value?.id ?? item.icon.value?.name ?? ""
                : String(item.icon.value);
        return skinId.trim() ? `${MC_HEADS_BASE}/${skinId}` : null;
    }

    if (item.icon.format === 'attribute' || item.icon.format === 'legacy') {
        const iconValue =
            typeof item.icon.value === 'object'
                ? item.icon.value.name
                : item.icon.value.replace(':', '_');

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
            <img src="/wynn.webp" alt={alt ?? ""} className={imgClass} loading="lazy" />
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