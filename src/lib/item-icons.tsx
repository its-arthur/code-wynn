import { ItemEntry } from "@/types/item";
import { wynnItemGuideUrl } from "@/lib/wynn-cdn";
import { cn } from "@/lib/utils";
import { useState } from "react";

const MC_HEADS_BASE = "https://mc-heads.net/head";

function getItemIconUrl(item: ItemEntry | string): string | null {
    if (typeof item === "string") {
        return wynnItemGuideUrl(item);
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