"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ItemIcon } from "@/lib/item-icons";
import { getRarityStyles } from "@/lib/rarity-color";
import { quickSearchItems } from "@/api/item";
import type { ItemEntry } from "@/types/item";
import { cn } from "@/lib/utils";

function formatType(type: string, subType?: string) {
	const t = type.replace(/([A-Z])/g, " $1").trim();
	if (!subType) return t;
	const s = subType.replace(/([A-Z])/g, " $1").trim();
	return `${s} ${t}`;
}

export function ItemInfo({
	open,
	onOpenChange,
	name = "",
	item: itemProp,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	name?: string;
	item?: ItemEntry | null;
}) {
	const [fetchedItem, setFetchedItem] = useState<ItemEntry | null>(null);
	const [loading, setLoading] = useState(false);
	const [fetched, setFetched] = useState(false);

	// Use item prop directly when provided; otherwise fetch by name
	const item = itemProp ?? fetchedItem;
	const hasItemProp = itemProp != null;

	useEffect(() => {
		if (!open || hasItemProp || !name.trim()) {
			setFetchedItem(null);
			setFetched(false);
			return;
		}
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
	}, [open, name, onOpenChange, hasItemProp]);

	// Only open dialog when we have content to show (never during loading; on error we close via onOpenChange)
	const dialogOpen =
		open && (hasItemProp || (!loading && (fetchedItem !== null || fetched)));

	const displayName = item?.internalName ?? name;
	const rarity = (item?.rarity ?? "").toLowerCase();
	const rarityStyles = rarity
		? getRarityStyles(rarity.charAt(0).toUpperCase() + rarity.slice(1))
		: null;

	return (
		<Dialog open={dialogOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="sr-only">Item info</DialogTitle>
				</DialogHeader>

				{item ? (
					<div className="space-y-4">
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
								<div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
									<span className="capitalize">
										{formatType(item.type, item.subType)}
									</span>
									{item.rarity && (
										<span className="capitalize">• {item.rarity}</span>
									)}
									{item.requirements?.level != null && (
										<span>• Lv. {item.requirements.level}</span>
									)}
									{item.tier != null && (
										<span>
											• Tier {typeof item.tier === "number" ? item.tier : item.tier}
										</span>
									)}
								</div>
							</div>
						</div>

						{item.attackSpeed && (
							<p className="text-sm text-muted-foreground">
								<span className="font-medium">Attack speed:</span>{" "}
								{item.attackSpeed.replace(/([A-Z])/g, " $1").trim()}
							</p>
						)}

						{item.base && (
							<div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
								<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Base stats
								</p>
								<div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
									{item.base.baseDamage && (
										<span>
											Damage:{" "}
											{item.base.baseDamage.min}–{item.base.baseDamage.max}
										</span>
									)}
									{item.base.baseHealth != null && (
										<span>Health: {item.base.baseHealth}</span>
									)}
								</div>
							</div>
						)}

						{item.identifications && Object.keys(item.identifications).length > 0 && (
							<div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
								<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Identifications
								</p>
								<ul className="mt-1 space-y-0.5 text-sm">
									{Object.entries(item.identifications).map(([id, val]) => {
										const v =
											typeof val === "object"
												? `${val.min}–${val.max}`
												: String(val);
										return (
											<li key={id} className="capitalize">
												{id.replace(/([A-Z])/g, " $1").trim()}: {v}
											</li>
										);
									})}
								</ul>
							</div>
						)}

						{item.lore && (
							<p className="text-sm text-muted-foreground italic">{item.lore}</p>
						)}
					</div>
				) : fetched ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No item found for &quot;{name}&quot;
					</p>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
