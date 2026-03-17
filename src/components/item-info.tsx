"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
    DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ItemIcon } from "@/lib/item-icons";
import { getRarityStyles } from "@/lib/rarity-color";
import { wynnAspectIconUrl } from "@/lib/wynn-cdn";
import { quickSearchItems } from "@/api/item";
import { getAspects } from "@/api/aspects";
import type { ItemEntry, ItemIdentification } from "@/types/item";
import type { AspectEntry } from "@/types/aspects";
import type { CompletedData } from "@/components/raidpool/region-card";
import { AbilityMarkup } from "@/components/ability-markup";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

function isItemValidForTrademarket(item: ItemEntry): boolean {
    const t = (item.type ?? "").toLowerCase();
    return !t.includes("aspect") && t !== "consumable" && t !== "tome";
}

function AspectTiersDisplay({ aspect }: { aspect: AspectEntry }) {
    const tiers = Object.entries(aspect.tiers).sort(
        ([a], [b]) => Number(a) - Number(b),
    );
    const iconName =
        typeof aspect.icon?.value === "object" && aspect.icon?.value?.name
            ? aspect.icon.value.name
            : typeof aspect.icon?.value === "string"
                ? aspect.icon.value
                : null;
    const iconUrl = iconName ? wynnAspectIconUrl(iconName) : null;
    const rarityStyles = getRarityStyles(
        aspect.rarity.charAt(0).toUpperCase() + aspect.rarity.slice(1),
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/40">
                    {iconUrl && (
                        <img
                            src={iconUrl}
                            alt=""
                            className="size-10 shrink-0 object-contain"
                        />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3
                        className={cn(
                            "font-semibold text-lg",
                            rarityStyles?.text ?? "text-foreground",
                        )}
                    >
                        {aspect.name}
                    </h3>
                    {aspect.rarity && (
                        <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                            {aspect.rarity}
                        </p>
                    )}
                </div>
            </div>

            {/* Basic info */}
            <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="capitalize">Aspect</p>
                </div>
                <div>
                    <span className="text-muted-foreground">Class</span>
                    <p className="capitalize">{aspect.requiredClass}</p>
                </div>
            </div>

            {/* Tiers */}
            <div>
                <p className="mb-2 text-sm text-muted-foreground">
                    Tiers
                </p>
                <div className="space-y-3">
                    {tiers.map(([tierNum, tier]) => (
                        <div key={tierNum} className="space-y-1 text-center">
                            <div className="flex justify-center items-center gap-2">
                                <div className="h-px w-full bg-border/50 flex-1" />
                                <p className="text-xs font-medium  text-white">
                                    Tier {tierNum} (≥{tier.threshold} aspects)
                                </p>
                                <div className="h-px w-full bg-border/50 flex-1" />
                            </div>

                            <div className="space-y-0.5 text-sm [&_.wynn-api-markup]:text-sm">
                                {tier.description
                                    .filter((line) => line.trim() && line !== "</br>")
                                    .map((line, i) => (
                                        <AbilityMarkup key={i} html={line} as="div" />
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Extract aspect tree from type (e.g. "ArcherAspect" → "archer"). */
function getAspectTreeFromType(type: string | undefined): string | null {
    if (!type || !type.toLowerCase().includes("aspect")) return null;
    const tree = type.replace(/aspect/gi, "").trim();
    return tree ? tree.toLowerCase() : null;
}

/** Build ItemEntry from CompletedData for display and aspect detection */
function toItemFromCompletedData(data: CompletedData): ItemEntry {
    const { wynn, wynnInv } = data;
    if (wynn) {
        return { ...wynn, itemType: wynnInv.itemType ?? wynn.type } as ItemEntry & {
            itemType?: string;
        };
    }
    return {
        internalName: wynnInv.name,
        type: wynnInv.itemType ?? "Other",
        itemType: wynnInv.itemType,
    } as ItemEntry;
}

export function ItemInfo({
	open,
	onOpenChange,
    completedData: completedDataProp,
    name: nameProp,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
        completedData?: CompletedData | null;
        name?: string | null;
}) {
	const [fetchedItem, setFetchedItem] = useState<ItemEntry | null>(null);
	const [loading, setLoading] = useState(false);
	const [fetched, setFetched] = useState(false);
    const [aspectData, setAspectData] = useState<AspectEntry | null>(null);

    const hasCompletedData = completedDataProp != null;
    const name = nameProp ?? completedDataProp?.wynnInv.name ?? "";
    const itemProp = hasCompletedData ? toItemFromCompletedData(completedDataProp) : null;
	const item = itemProp ?? fetchedItem;


	useEffect(() => {
        if (!open || hasCompletedData || !name.trim()) {
			setFetchedItem(null);
			setFetched(false);
			return;
		}
        setFetchedItem(null);
		setLoading(true);
		setFetched(false);
		const loadingId = toast.loading("Loading item...", { duration: Infinity });
		quickSearchItems(name.trim())
			.then((db) => {
				const entry = db[name] ?? Object.values(db)[0] ?? null;
				setFetchedItem(entry);
				toast.dismiss(loadingId);
			})
			.catch((e) => {
				const message = e instanceof Error ? e.message : "Failed to load";
				onOpenChange(false);
				toast.error("Failed to load item", { description: message, id: loadingId });
				setFetchedItem(null);
			})
			.finally(() => {
				setLoading(false);
				setFetched(true);
			});
    }, [open, name, onOpenChange, hasCompletedData]);

    // Fetch aspect data when item type includes "aspect" (e.g. ArcherAspect → archer)
    const aspectTree = getAspectTreeFromType(
        completedDataProp?.wynnInv.subtype ??
        (item as { itemType?: string })?.itemType ??
        (item as { type?: string })?.type,
    );
    // API keys are full names (e.g. "Aspect of the North Wind"), not "archer"
    const aspectLookupName = aspectTree
        ? (completedDataProp?.wynnInv.name ??
            item?.internalName ??
            name)
        : null;
    useEffect(() => {
        if (!open || !aspectTree || !aspectLookupName) {
            setAspectData(null);
            return;
        }
        const loadingId = toast.loading("Loading aspect...", { duration: Infinity });
        getAspects(aspectTree)
            .then((aspects) => {
                const entry =
                    aspects[aspectLookupName] ??
                    Object.values(aspects).find(
                        (a) => a.name === aspectLookupName,
                    ) ??
                    null;
                setAspectData(entry);
                toast.dismiss(loadingId);
            })
            .catch((e) => {
                const message = e instanceof Error ? e.message : "Failed to load aspect";
                toast.error(message, { id: loadingId });
                setAspectData(null);
            });
    }, [open, aspectTree, aspectLookupName]);

    // Only open dialog when we have content to show. For aspect items, wait until aspect data is loaded.
	const dialogOpen =
        open &&
        (aspectTree
            ? aspectData != null
            : hasCompletedData || (!loading && (fetchedItem !== null || fetched)));

	const displayName = item?.internalName ?? name;
	const rarity = (item?.rarity ?? "").toLowerCase();
	const rarityStyles = rarity
		? getRarityStyles(rarity.charAt(0).toUpperCase() + rarity.slice(1))
		: null;

	return (
		<Dialog open={dialogOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="sr-only">Item info</DialogTitle>
				</DialogHeader>
                {item && aspectData && (
                    <AspectTiersDisplay aspect={aspectData} />
                )}
                {item && !aspectData ? (
					<div className="space-y-4">
                        {/* Header */}
						<div className="flex items-start gap-4">
							<div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/40">
								<ItemIcon item={item} alt={displayName} className="size-10" />
							</div>
							<div className="min-w-0 flex-1">
								<h3
									className={cn(
										"font-semibold text-lg",
										rarityStyles?.text ?? "text-foreground",
									)}
								>
									{displayName}
                                </h3>
                                {item.rarity && (
                                    <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                                        {item.rarity}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Basic info */}
                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                            {item.type && (
                                <div>
                                    <span className="text-muted-foreground">Type</span>
                                    <p className="capitalize">
                                        {(item as { weaponType?: string }).weaponType
                                            ? `${(item as { weaponType?: string }).weaponType} ${item.type}`
                                            : item.subType
                                                ? `${item.subType} ${item.type}`
                                                : item.type.replace(/([A-Z])/g, " $1").trim()}
                                    </p>
                                </div>
                            )}
                            {item.attackSpeed && (
                                <div>
                                    <span className="text-muted-foreground">Attack Speed</span>
                                    <p className="capitalize">
                                        {item.attackSpeed.replace(/([A-Z])/g, " $1").trim()}
                                    </p>
                                </div>
                            )}
                            {item.averageDPS != null && (
                                <div>
                                    <span className="text-muted-foreground">Avg DPS</span>
                                    <p>{item.averageDPS.toLocaleString()}</p>
                                </div>
                            )}
                            {item.powderSlots != null && (
                                <div>
                                    <span className="text-muted-foreground">Powder Slots</span>
                                    <p>{item.powderSlots}</p>
								</div>
                            )}
                            {item.dropRestriction && (
                                <div>
                                    <span className="text-muted-foreground">Drop</span>
                                    <p className="capitalize">{item.dropRestriction}</p>
                                </div>
                            )}
						</div>

                        {/* Requirements */}
                        {item.requirements &&
                            Object.keys(item.requirements).length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                                        Requirements
                                    </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                    {item.requirements.level != null && (
                                        <span>Lv. {item.requirements.level}</span>
                                    )}
                                    {item.requirements.classRequirement && (
                                        <span className="capitalize">
                                            {item.requirements.classRequirement.replace(/_/g, " ")}
                                        </span>
                                    )}
                                    {item.requirements.strength != null && (
                                        <span>Str {item.requirements.strength}</span>
                                    )}
                                    {item.requirements.dexterity != null && (
                                        <span>Dex {item.requirements.dexterity}</span>
                                    )}
                                    {item.requirements.intelligence != null && (
                                        <span>Int {item.requirements.intelligence}</span>
                                    )}
                                    {item.requirements.defence != null && (
                                        <span>Def {item.requirements.defence}</span>
                                    )}
                                    {item.requirements.agility != null && (
                                        <span>Agi {item.requirements.agility}</span>
                                    )}
                                </div>
                            </div>
                            )}

                        {/* Base stats */}
                        {item.base && Object.keys(item.base).length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    Base
								</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
									{item.base.baseDamage && (
										<span>
                                            Damage: {item.base.baseDamage.min} →{" "}
                                            {item.base.baseDamage.max}
										</span>
									)}
									{item.base.baseHealth != null && (
										<span>Health: {item.base.baseHealth}</span>
									)}
                                    {Object.entries(item.base).map(([key, val]) => {
                                        if (val == null || key === "baseDamage" || key === "baseHealth")
                                            return null;
                                        const v = val as {
                                            min?: number;
                                            max?: number;
                                            raw?: number;
                                        };
                                        if (typeof v === "object" && "min" in v && "max" in v) {
                                            const label = key
                                                .replace(/^base/, "")
                                                .replace(/([A-Z])/g, " $1")
                                                .replace(/^./, (s) => s.toUpperCase())
                                                .trim();
                                            return (
                                                <span key={key}>
                                                    {label}: {v.min} → {v.max}
                                                </span>
                                            );
                                        }
                                        return null;
                                    })}
								</div>
							</div>
						)}

                        {/* Identifications */}
                        {item.identifications &&
                            Object.keys(item.identifications).length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                                        Identifications
                                    </p>
                                <div className="grid gap-1.5 gap-x-4 text-sm sm:grid-cols-2">
                                    {Object.entries(item.identifications).map(([key, val]) => {
                                        const id = val as number | ItemIdentification;
                                        const isRange =
                                            typeof id === "object" &&
                                            id != null &&
                                            "min" in id &&
                                            "max" in id;
                                        const label = key
                                            .replace(/([A-Z])/g, " $1")
                                            .replace(/^./, (s) => s.toUpperCase())
                                            .trim();
                                        return (
                                            <div key={key} className="flex justify-between gap-2">
                                                <span className="capitalize text-muted-foreground">
                                                    {label}
                                                </span>
                                                <span className="tabular-nums">
                                                    {isRange
                                                        ? `${(id as ItemIdentification).min} ~ ${(id as ItemIdentification).raw} ~ ${(id as ItemIdentification).max}`
                                                        : String(id)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    </div>
                                </div>
                            )}

                        {/* Lore */}
						{item.lore && (
                            <div>
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    Lore
                                </p>
                                <p className="text-sm italic leading-relaxed text-muted-foreground">
                                    {item.lore}
                                </p>
                            </div>
						)}
					</div>
				) : fetched ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No item found for &quot;{name}&quot;
					</p>
				) : null}
                {item &&
                    !aspectData &&
                    isItemValidForTrademarket(item) && (
                        <DialogFooter>
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={`/trademarket/${encodeURIComponent(displayName)}${typeof item.tier === "number" ? `?tier=${item.tier}` : ""}`}
                                    target="_blank"
                                >
                                    <ExternalLink className="mr-1.5 size-3.5" />
                                    Trade market
                                </Link>
                            </Button>
                        </DialogFooter>
                    )}
			</DialogContent>
		</Dialog>
	);
}
