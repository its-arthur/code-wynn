"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	ChevronDown,
	Info,
	Loader2,
	RefreshCw,
	Search,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getItemMetadata } from "@/api/item";
import { useTradeMarketStore } from "@/store/trademarket-store";
import type { ItemMetadata } from "@/types/item";
import type {
	MergedPopularEntry,
	MergedNewlyListedEntry,
	CompletedData,
} from "@/types/wynnventory/trademarket";
import type { ItemEntry } from "@/types/item";
import { ItemIcon } from "@/lib/item-icons";
import { ItemSearchInput } from "@/components/items/item-search-input";
import { EmeraldPrice } from "@/components/emerald-price";
import { Input } from "@/components/ui/input";
import { cn, tierRoman, formatTimeElapsed } from "@/lib/utils";
import { getRarityStyles } from "@/lib/rarity-color";
import { resolveWynnData } from "@/lib/resolve-wynn-item";
import { ItemInfo } from "@/components/item-info";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

const GEAR_TYPES = ["armour", "armor", "weapon", "accessory"];
const MATERIAL_TYPES = ["material", "ingredient"];

const TIER_ROMAN_TO_NUM: Record<string, number> = {
	I: 1,
	II: 2,
	III: 3,
	IV: 4,
	V: 5,
	VI: 6,
	VII: 7,
	VIII: 8,
	IX: 9,
	X: 10,
	XI: 11,
	XII: 12,
	XIII: 13,
	XIV: 14,
	XV: 15,
	XVI: 16,
	XVII: 17,
	XVIII: 18,
	XIX: 19,
	XX: 20,
};

function parseTierFromString(s: string): number | null {
	const n = parseInt(s, 10);
	if (!Number.isNaN(n) && n >= 1 && n <= 20) return n;
	const upper = s.toUpperCase().trim();
	return TIER_ROMAN_TO_NUM[upper] ?? null;
}

function isGearType(type: string | undefined): boolean {
	if (!type) return false;
	const t = type.toLowerCase();
	return GEAR_TYPES.includes(t);
}

function isMaterialType(type: string | undefined): boolean {
	if (!type) return false;
	const t = type.toLowerCase();
	return MATERIAL_TYPES.includes(t);
}

/** Item types that should not show the item info button */
function isItemInfoHiddenType(type: string | undefined, subType?: string): boolean {
	const t = (type ?? "").toLowerCase();
	const s = (subType ?? "").toLowerCase();
	return (
		t === "key" ||
		t === "enchanter" ||
		t === "other" ||
		s === "other" ||
		t === "emeraldpouch" ||
		t === "mounts" ||
		t.includes("mount")
	);
}

function getItemTypeDisplay(item: ItemEntry | undefined): string | undefined {
	if (!item) return undefined;
	const withExtras = item as ItemEntry & { weaponType?: string };
	if (withExtras.weaponType)
		return withExtras.weaponType.replace(/([A-Z])/g, " $1").trim();
	if (
		item.type?.toLowerCase() === "armour" ||
		item.type?.toLowerCase() === "armor"
	)
		return (item.armourType ?? item.subType)?.replace(/([A-Z])/g, " $1").trim();
	return item.type?.replace(/([A-Z])/g, " $1").trim();
}

/** Get item field value for advanced filter key (weapon->weaponType, armour->armourType, accessory->accessoryType, attackSpeed->attackSpeed, else subType) */
function getItemAdvancedValue(
	item: ItemEntry | undefined,
	advKey: string,
): string | undefined {
	if (!item) return undefined;
	const ext = item as ItemEntry & { weaponType?: string };
	const k = advKey.toLowerCase();
	if (k === "weapon") return ext.weaponType ?? item.subType;
	if (k === "armour" || k === "armor") return item.armourType ?? item.subType;
	if (k === "accessory") return item.accessoryType ?? item.subType;
	if (k === "attackspeed") return item.attackSpeed;
	return item.subType;
}

function itemMatchesAdvancedFilter(
	item: ItemEntry | undefined,
	advKey: string,
	advValue: string,
): boolean {
	const val = getItemAdvancedValue(item, advKey);
	if (!val) return false;
	return val.toLowerCase() === advValue.toLowerCase();
}

const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute

export default function TradeMarketPage() {
	const router = useRouter();
	const {
		ranking,
		listings,
		itemDb,
		loading,
		loadingListings,
		error,
		fetch,
		fetchListings,
		refreshInBackground,
	} = useTradeMarketStore();
	const [tab, setTab] = useState<"popular" | "newly_listed">("popular");
	const [searchQuery, setSearchQuery] = useState("");
	const [appliedSearch, setAppliedSearch] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);
	const [sortKey, setSortKey] = useState<
		"name" | "lowest" | "average" | "quantity" | "price" | "listed"
	>("quantity");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [filterType, setFilterType] = useState<string | null>(null);
	const [filterAdvanced, setFilterAdvanced] = useState<Record<string, string>>(
		{},
	);
	const [filterTierItem, setFilterTierItem] = useState<string | null>(null);
	const [filterIngredientTier, setFilterIngredientTier] = useState<
		string | null
	>(null);
	const [levelMinInput, setLevelMinInput] = useState("");
	const [levelMaxInput, setLevelMaxInput] = useState("");
	const [filterLevelMin, setFilterLevelMin] = useState<number | null>(null);
	const [filterLevelMax, setFilterLevelMax] = useState<number | null>(null);
	useEffect(() => {
		setPage(1);
		setSortKey(tab === "popular" ? "quantity" : "listed");
		setSortDir("desc");
	}, [tab]);
	useEffect(() => {
		setPage(1);
	}, [
		filterType,
		filterAdvanced,
		filterTierItem,
		filterIngredientTier,
		filterLevelMin,
		filterLevelMax,
	]);
	useEffect(() => {
		setPage(1);
	}, [pageSize]);

	useEffect(() => {
		if (tab === "newly_listed") fetchListings();
	}, [tab, fetchListings]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	// Refresh cache every 1 minute in background
	useEffect(() => {
		const id = setInterval(refreshInBackground, REFRESH_INTERVAL_MS);
		return () => clearInterval(id);
	}, [refreshInBackground]);

	const [metadata, setMetadata] = useState<ItemMetadata | null>(null);
	useEffect(() => {
		getItemMetadata()
			.then(setMetadata)
			.catch(() => {});
	}, []);

	const mergedPopular = useMemo((): MergedPopularEntry[] => {
		let result = ranking.sort((a, b) => b.total_count - a.total_count);
		if (filterType) {
			if (filterType === "gearItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier);
					return isGearType(wynn?.type);
				});
			} else if (filterType === "MaterialItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier);
					return wynn?.type?.toLowerCase() === "material";
				});
			} else if (filterType === "IngredientItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier);
					return wynn?.type?.toLowerCase() === "ingredient";
				});
			} else if (filterType === "DungeonKeyItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier);
					return wynn?.type?.toLowerCase() === "key";
				});
			} else if (filterType === "MountItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier);
					const t = wynn?.type?.toLowerCase() ?? "";
					return t === "mounts" || t.includes("mount");
				});
			} else if (filterType === "EnchanterItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier);
					return wynn?.type?.toLowerCase() === "enchanter";
				});
			} else if (filterType === "OtherItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier);
					const type = wynn?.type?.toLowerCase() ?? "";
					const subType = wynn?.subType?.toLowerCase() ?? "";
					return (
						type === "other" ||
						subType === "other" ||
						type === "emeraldpouch"
					);
				});
			} else {
				const t = filterType.toLowerCase();
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier);
					return (
						wynn?.type?.toLowerCase() === t ||
						wynn?.subType?.toLowerCase() === t
					);
				});
			}
		}
		if (Object.keys(filterAdvanced).length > 0) {
			const advEntries = Object.entries(filterAdvanced).filter(
				([k]) => k.toLowerCase() !== "attackspeed",
			);
			if (advEntries.length > 0) {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier);
					return advEntries.every(([advKey, advValue]) =>
						itemMatchesAdvancedFilter(wynn ?? undefined, advKey, advValue),
					);
				});
			}
		}
		if (filterTierItem) {
			const tierLower = filterTierItem.toLowerCase();
			// metadata.filters.tier.items = rarity names (common, unique, rare, etc.)
			result = result.filter((r) => {
				const wynn = resolveWynnData(itemDb, r.name, r.tier);
				const rarity = wynn?.rarity?.toLowerCase() ?? "";
				return rarity === tierLower;
			});
		}
		if (filterIngredientTier) {
			const tierNum = Number(filterIngredientTier);
			result = result.filter((r) => r.tier === tierNum);
		}
		if (filterLevelMin != null || filterLevelMax != null) {
			result = result.filter((r) => {
				const wynn = resolveWynnData(itemDb, r.name, r.tier);
				const level = wynn?.requirements?.level;
				if (level == null) return false;
				if (filterLevelMin != null && level < filterLevelMin) return false;
				if (filterLevelMax != null && level > filterLevelMax) return false;
				return true;
			});
		}
		if (appliedSearch.trim()) {
			const q = appliedSearch.trim().toLowerCase();
			result = result.filter((r) => {
				const wynn = resolveWynnData(itemDb, r.name, r.tier);
				return (
					r.name.toLowerCase().includes(q) ||
					(wynn?.type?.toLowerCase().includes(q) ?? false) ||
					(wynn?.subType?.toLowerCase().includes(q) ?? false)
				);
			});
		}
		return result.map((r) => ({
			name: r.name,
			tier: r.tier,
			completedData: {
				wynn: resolveWynnData(itemDb, r.name, r.tier),
				wynnInv: r,
			},
		}));
	}, [
		ranking,
		itemDb,
		appliedSearch,
		filterType,
		filterAdvanced,
		filterTierItem,
		filterIngredientTier,
		filterLevelMin,
		filterLevelMax,
	]);

	const mergedNewlyListed = useMemo((): MergedNewlyListedEntry[] => {
		let result = listings;
		if (filterType) {
			if (filterType === "gearItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
					const listingType =
						(r.listing as { type?: string; item_type?: string })?.type ??
						(r.listing as { type?: string; item_type?: string })?.item_type;
					return isGearType(wynn?.type) || isGearType(listingType);
				});
			} else if (filterType === "MaterialItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
					const listingType =
						(r.listing as { type?: string; item_type?: string })?.type ??
						(r.listing as { type?: string; item_type?: string })?.item_type;
					const type =
						wynn?.type?.toLowerCase() ?? listingType?.toLowerCase() ?? "";
					return type === "material";
				});
			} else if (filterType === "IngredientItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
					const listingType =
						(r.listing as { type?: string; item_type?: string })?.type ??
						(r.listing as { type?: string; item_type?: string })?.item_type;
					return (
						wynn?.type?.toLowerCase() === "ingredient" ||
						listingType?.toLowerCase() === "ingredient"
					);
				});
			} else if (filterType === "DungeonKeyItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
					const listingType =
						(r.listing as { type?: string; item_type?: string })?.type ??
						(r.listing as { type?: string; item_type?: string })?.item_type;
					return (
						wynn?.type?.toLowerCase() === "key" ||
						listingType?.toLowerCase() === "key"
					);
				});
			} else if (filterType === "MountItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
					const listingType =
						(r.listing as { type?: string; item_type?: string })?.type ??
						(r.listing as { type?: string; item_type?: string })?.item_type;
					const t = wynn?.type?.toLowerCase() ?? "";
					const lt = listingType?.toLowerCase() ?? "";
					return (
						t === "mounts" ||
						t.includes("mount") ||
						lt === "mounts" ||
						lt.includes("mount")
					);
				});
			} else if (filterType === "EnchanterItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
					const listingType =
						(r.listing as { type?: string; item_type?: string })?.type ??
						(r.listing as { type?: string; item_type?: string })?.item_type;
					return (
						wynn?.type?.toLowerCase() === "enchanter" ||
						listingType?.toLowerCase() === "enchanter"
					);
				});
			} else if (filterType === "OtherItem") {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
					const listingType =
						(r.listing as { type?: string; item_type?: string })?.type ??
						(r.listing as { type?: string; item_type?: string })?.item_type;
					const type = wynn?.type?.toLowerCase() ?? "";
					const subType = wynn?.subType?.toLowerCase() ?? "";
					const lt = listingType?.toLowerCase() ?? "";
					return (
						type === "other" ||
						subType === "other" ||
						type === "emeraldpouch" ||
						lt === "other" ||
						lt === "emeraldpouch"
					);
				});
			} else {
				const t = filterType.toLowerCase();
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
					const listingType =
						(r.listing as { type?: string; item_type?: string })?.type ??
						(r.listing as { type?: string; item_type?: string })?.item_type;
					return (
						wynn?.type?.toLowerCase() === t ||
						wynn?.subType?.toLowerCase() === t ||
						listingType?.toLowerCase() === t
					);
				});
			}
		}
		if (Object.keys(filterAdvanced).length > 0) {
			const advEntries = Object.entries(filterAdvanced).filter(
				([k]) => k.toLowerCase() !== "attackspeed",
			);
			if (advEntries.length > 0) {
				result = result.filter((r) => {
					const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
					const listing = r.listing as { type?: string; item_type?: string };
					return advEntries.every(([advKey, advValue]) => {
						if (wynn) return itemMatchesAdvancedFilter(wynn, advKey, advValue);
						const listingType = listing?.type ?? listing?.item_type ?? "";
						return listingType?.toLowerCase() === advValue.toLowerCase();
					});
				});
			}
		}
		if (filterTierItem) {
			const tierLower = filterTierItem.toLowerCase();
			// metadata.filters.tier.items = rarity names (common, unique, rare, etc.)
			result = result.filter((r) => {
				const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
				const listingRarity = r.listing.rarity?.toLowerCase();
				const rarity = wynn?.rarity?.toLowerCase() ?? listingRarity ?? "";
				return rarity === tierLower;
			});
		}
		if (filterIngredientTier) {
			const tierNum = Number(filterIngredientTier);
			result = result.filter((r) => r.tier === tierNum);
		}
		if (filterLevelMin != null || filterLevelMax != null) {
			result = result.filter((r) => {
				const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
				const level = wynn?.requirements?.level;
				if (level == null) return false;
				if (filterLevelMin != null && level < filterLevelMin) return false;
				if (filterLevelMax != null && level > filterLevelMax) return false;
				return true;
			});
		}
		if (appliedSearch.trim()) {
			const q = appliedSearch.trim().toLowerCase();
			result = result.filter((r) => {
				const wynn = resolveWynnData(itemDb, r.name, r.tier, r.listing);
				return (
					r.name.toLowerCase().includes(q) ||
					(wynn?.type?.toLowerCase().includes(q) ?? false) ||
					(wynn?.subType?.toLowerCase().includes(q) ?? false)
				);
			});
		}
		return result.map((r) => ({
			name: r.name,
			tier: r.tier,
			completedData: {
				wynn: resolveWynnData(itemDb, r.name, r.tier, r.listing),
				wynnInv: {
					listing: r.listing,
					listing_price: r.listing_price,
					timestamp: r.timestamp,
				},
			},
		}));
	}, [
		listings,
		itemDb,
		appliedSearch,
		filterType,
		filterAdvanced,
		filterTierItem,
		filterIngredientTier,
		filterLevelMin,
		filterLevelMax,
	]);

	const filtered = tab === "popular" ? mergedPopular : mergedNewlyListed;
	const isRankingData = tab === "popular";

	const sortedFiltered = useMemo(() => {
		const arr = [...filtered];
		const dir = sortDir === "asc" ? 1 : -1;
		arr.sort((a, b) => {
			if (sortKey === "name") {
				const na = (
					a as MergedPopularEntry | MergedNewlyListedEntry
				).name.toLowerCase();
				const nb = (
					b as MergedPopularEntry | MergedNewlyListedEntry
				).name.toLowerCase();
				return dir * na.localeCompare(nb);
			}
			if (isRankingData) {
				const ea = a as MergedPopularEntry;
				const eb = b as MergedPopularEntry;
				if (sortKey === "lowest")
					return (
						dir *
						(ea.completedData.wynnInv.lowest_price -
							eb.completedData.wynnInv.lowest_price)
					);
				if (sortKey === "average")
					return (
						dir *
						(ea.completedData.wynnInv.average_price -
							eb.completedData.wynnInv.average_price)
					);
				if (sortKey === "quantity")
					return (
						dir *
						(ea.completedData.wynnInv.total_count -
							eb.completedData.wynnInv.total_count)
					);
			} else {
				const ea = a as MergedNewlyListedEntry;
				const eb = b as MergedNewlyListedEntry;
				if (sortKey === "price")
					return (
						dir *
						(ea.completedData.wynnInv.listing_price -
							eb.completedData.wynnInv.listing_price)
					);
				if (sortKey === "listed")
					return (
						dir *
						(new Date(ea.completedData.wynnInv.timestamp).getTime() -
							new Date(eb.completedData.wynnInv.timestamp).getTime())
					);
			}
			return 0;
		});
		return arr;
	}, [filtered, sortKey, sortDir, isRankingData]);

	const total = sortedFiltered.length;
	const maxPage = Math.max(1, Math.ceil(total / pageSize));
	const pageItems = sortedFiltered.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	function toggleSort(key: typeof sortKey) {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir(key === "name" ? "asc" : "desc");
		}
		setPage(1);
	}

	function SortIcon({ column }: { column: typeof sortKey }) {
		if (sortKey !== column)
			return <ArrowUpDown className="ml-1 size-3.5 opacity-50" />;
		return sortDir === "asc" ? (
			<ArrowUp className="ml-1 size-3.5" />
		) : (
			<ArrowDown className="ml-1 size-3.5" />
		);
	}
	const pageNumbers = useMemo(() => {
		const pages: (number | "ellipsis")[] = [];
		const delta = 2;
		const start = Math.max(2, page - delta);
		const end = Math.min(maxPage - 1, page + delta);

		pages.push(1);
		if (start > 2) pages.push("ellipsis");
		for (let i = start; i <= end; i++) pages.push(i);
		if (end < maxPage - 1) pages.push("ellipsis");
		if (maxPage > 1) pages.push(maxPage);

		return pages;
	}, [page, maxPage]);

	useEffect(() => {
		pageItems.forEach((entry) => {
			const m = entry as MergedPopularEntry | MergedNewlyListedEntry;
			console.log(
				`[TradeMarket] ${m.name}${m.tier != null ? ` ${m.tier}` : ""}`,
				{
					completedData: {
						wynn: m.completedData.wynn,
						wynnInv: m.completedData.wynnInv,
					},
				},
			);
		});
	}, [pageItems]);

	const [itemInfoOpen, setItemInfoOpen] = useState(false);
	const [itemInfoName, setItemInfoName] = useState<string | null>(null);

	const openItemInfo = useCallback((name: string) => {
		setItemInfoName(name);
		setItemInfoOpen(true);
	}, []);

	return (
		<div className="flex flex-col gap-6 lg:flex-row lg:items-start relative">
			<ItemInfo
				open={itemInfoOpen}
				onOpenChange={setItemInfoOpen}
				name={itemInfoName}
			/>
			{/* Main content */}
			<div className="min-w-0 flex-1 space-y-4 order-last lg:order-0">
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-3">
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
							<ItemSearchInput
								value={searchQuery}
								onChange={setSearchQuery}
								onSelect={(name, tier) => {
									if (name) {
										const base = `/trademarket/${encodeURIComponent(name)}`;
										const url = tier != null ? `${base}?tier=${tier}` : base;
										router.push(url);
									}
								}}
								onEnterSubmit={(v) => {
									setAppliedSearch(v.trim());
									setPage(1);
								}}
								onClear={() => setAppliedSearch("")}
								className="flex-1 min-w-0"
							/>
							<Button
								variant="outline"
								size="sm"
								className="min-h-9 sm:min-h-0 w-full sm:w-auto shrink-0"
								onClick={() => {
									setAppliedSearch(searchQuery.trim());
									setPage(1);
								}}
							>
								<Search className="size-4" />
								Search
							</Button>
						</div>

						<div className="flex sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2">
							<div className="flex rounded-lg border border-border/50 p-0.5 w-fit shrink-0">
								<button
									type="button"
									onClick={() => setTab("popular")}
									className={cn(
										"rounded-md px-3 py-2 sm:py-1.5 text-sm font-medium transition-colors min-h-9 sm:min-h-0",
										tab === "popular"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									Popular
								</button>
								<button
									type="button"
									onClick={() => setTab("newly_listed")}
									className={cn(
										"rounded-md px-3 py-2 sm:py-1.5 text-sm font-medium transition-colors min-h-9 sm:min-h-0",
										tab === "newly_listed"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									Newly Listed
								</button>
							</div>
							<div className="flex flex-wrap items-center gap-2 shrink-0">
								{maxPage > 1 && (
									<div className="flex items-center gap-0.5">
										<Button
											variant="outline"
											size="sm"
											className="h-9 w-9 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
											onClick={() => {
												setPage((p) => Math.max(1, p - 1));
												window.scrollTo({ top: 0, behavior: "smooth" });
											}}
											disabled={page <= 1}
										>
											{"<"}
										</Button>
										<span className="text-sm text-muted-foreground tabular-nums px-2 text-center">
											{page}/{maxPage}
										</span>
										<Button
											variant="outline"
											size="sm"
											className="h-9 w-9 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
											onClick={() => {
												setPage((p) => Math.min(maxPage, p + 1));
												window.scrollTo({ top: 0, behavior: "smooth" });
											}}
											disabled={page >= maxPage}
										>
											{">"}
										</Button>
									</div>
								)}
								<Button
									variant="outline"
									size="sm"
									className="min-h-9 min-w-9 sm:min-h-0 sm:min-w-0 shrink-0"
									onClick={() =>
										tab === "popular" ? fetch(true) : fetchListings(true)
									}
									disabled={tab === "popular" ? loading : loadingListings}
								>
									{loading || loadingListings ? (
										<Loader2 className="animate-spin" />
									) : (
										<RefreshCw />
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>

				{error && (
					<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				)}

				<Table className="[&_tbody_td]:py-3 sm:[&_tbody_td]:py-4">
					<TableHeader>
						<TableRow>
							<TableHead>
								<button
									type="button"
									className="flex items-center hover:text-foreground text-xs sm:text-sm"
									onClick={() => toggleSort("name")}
								>
									Name
									<SortIcon column="name" />
								</button>
							</TableHead>
							<TableHead className="text-right">
								<button
									type="button"
									className="ml-auto flex items-center justify-end hover:text-foreground text-xs sm:text-sm"
									onClick={() => toggleSort(isRankingData ? "lowest" : "price")}
								>
									{isRankingData ? "Lowest" : "Price"}
									<SortIcon column={isRankingData ? "lowest" : "price"} />
								</button>
							</TableHead>
							{isRankingData && (
								<>
									<TableHead className="text-right hidden sm:table-cell">
										<button
											type="button"
											className="ml-auto flex items-center justify-end hover:text-foreground text-xs sm:text-sm"
											onClick={() => toggleSort("average")}
										>
											Average
											<SortIcon column="average" />
										</button>
									</TableHead>
									<TableHead className="w-24 text-right">
										<button
											type="button"
											className="ml-auto flex items-center justify-end hover:text-foreground text-xs sm:text-sm"
											onClick={() => toggleSort("quantity")}
										>
											Quantity
											<SortIcon column="quantity" />
										</button>
									</TableHead>
								</>
							)}
							{!isRankingData && (
								<TableHead className="text-right">
									<button
										type="button"
										className="ml-auto flex items-center justify-end hover:text-foreground text-xs sm:text-sm"
										onClick={() => toggleSort("listed")}
									>
										Listed
										<SortIcon column="listed" />
									</button>
								</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading || (tab === "newly_listed" && loadingListings) ? (
							Array.from({ length: pageSize }).map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton className="h-14 w-full rounded-md" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-14 w-full rounded-md" />
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										<Skeleton className="h-14 w-full rounded-md" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-14 w-full rounded-md" />
									</TableCell>
								</TableRow>
							))
						) : pageItems.length > 0 ? (
							isRankingData ? (
								pageItems.map((entry) => {
									const m = entry as MergedPopularEntry;
									const { wynn, wynnInv } = m.completedData;
									const raw = wynn?.rarity ?? "";
									const rarity = raw
										? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
										: "";
									const { text, border } = getRarityStyles(rarity);
									return (
										<TableRow
											key={m.name + m.tier}
											className="group cursor-pointer"
											onClick={() => {
												router.push(
													`/trademarket/${encodeURIComponent(m.name)}${m.tier != null ? `?tier=${m.tier}` : ""}`,
												);
											}}
										>
											<TableCell
												className={cn("flex items-center gap-4 font-sans")}
											>
												<div className={cn("relative rounded-md border-2 p-2", border)}>
													<ItemIcon
														item={wynn ?? m.name}
														alt={m.name}
														className="size-12"
													/>
													{!isItemInfoHiddenType(wynn?.type, wynn?.subType) && (
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																openItemInfo(m.name);
															}}
															className="absolute bottom-0 right-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
															aria-label="View item info"
														>
															<Info className="size-4" />
														</button>
													)}
												</div>

												<div className="min-w-0">
													<span
														className={cn(
															"text-lg font-medium group-hover:underline",
														)}
													>
														{m.name}
														{m.tier ? ` ${tierRoman(m.tier)}` : ""}
													</span>
													{wynn && (
														<div
															className={cn(
																"flex flex-wrap items-center gap-2 text-sm capitalize font-mono truncate",
																text,
															)}
														>
															{[
																wynn.requirements?.level != null &&
																	`Lv.${wynn.requirements.level}`,
																rarity,
																getItemTypeDisplay(wynn),
															]
																.filter(Boolean)
																.map((s, i) => (
																	<span key={i}>{s}</span>
																))}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell className="text-right font-mono">
												<EmeraldPrice price={wynnInv.lowest_price} size="lg" />
											</TableCell>
											<TableCell className="text-right font-mono hidden sm:table-cell">
												<EmeraldPrice price={wynnInv.average_price} size="lg" />
											</TableCell>
											<TableCell className="text-right text-lg tabular-nums font-mono">
												{wynnInv.total_count.toLocaleString()}
											</TableCell>
										</TableRow>
									);
								})
							) : (
								pageItems.map((entry) => {
									const m = entry as MergedNewlyListedEntry;
									const { wynn, wynnInv } = m.completedData;
									const raw = wynn?.rarity ?? wynnInv.listing?.rarity ?? "";
									const rarity = raw
										? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
										: "";
									const { text } = getRarityStyles(rarity);
									return (
										<TableRow
											key={m.name + m.tier + wynnInv.timestamp}
											className="group cursor-pointer"
											onClick={() => {
												router.push(
													`/trademarket/${encodeURIComponent(m.name)}${m.tier != null ? `?tier=${m.tier}` : ""}`,
												);
											}}
										>
											<TableCell
												className={cn("flex items-center gap-2 font-sans")}
											>
												<ItemIcon
													item={
														wynn ??
														(typeof wynnInv.listing.icon?.value === "string"
															? wynnInv.listing.icon.value
															: m.name)
													}
													alt={m.name}
													className="size-12"
												/>
												<div className="min-w-0">
													<span
														className={cn(
															"text-lg font-medium group-hover:underline",
														)}
													>
														{m.name}
														{m.tier ? ` ${tierRoman(m.tier)}` : ""}
													</span>
													{(wynn || wynnInv.listing) && (
														<div
															className={cn(
																"flex flex-wrap items-center gap-2 text-sm capitalize font-mono truncate",
																text,
															)}
														>
															{[
																wynn?.requirements?.level != null &&
																	`Lv.${wynn.requirements.level}`,
																rarity,
																getItemTypeDisplay(wynn ?? undefined),
															]
																.filter(Boolean)
																.map((s, i) => (
																	<span key={i}>{s}</span>
																))}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell className="text-right font-mono">
												<EmeraldPrice price={wynnInv.listing_price} size="lg" />
											</TableCell>
											<TableCell
												className="text-right text-muted-foreground text-sm"
												suppressHydrationWarning
											>
												{formatTimeElapsed(wynnInv.timestamp)}
											</TableCell>
										</TableRow>
									);
								})
							)
						) : (
							<TableRow>
								<TableCell
									colSpan={isRankingData ? 4 : 3}
									className="py-20 text-center text-sm text-muted-foreground"
								>
									No items found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>

				{!loading && pageItems.length > 0 && (
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center pt-2 w-full gap-3">
						<div className="flex-1 shrink-0 min-w-0 items-center gap-2 font-sans flex">
							<p className="text-sm text-muted-foreground">Limit:</p>
							<Select
								value={String(pageSize)}
								onValueChange={(v) => setPageSize(Number(v))}
							>
								<SelectTrigger size="sm" className="h-8 w-[80px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PAGE_SIZE_OPTIONS.map((n) => (
										<SelectItem key={n} value={String(n)}>
											{n}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex-1 flex items-center justify-center gap-2">
							{maxPage > 1 && (
								<>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setPage((p) => Math.max(1, p - 1));
											window.scrollTo({ top: 0, behavior: "smooth" });
										}}
										disabled={page <= 1}
									>
										‹
									</Button>

									{pageNumbers.map((p, i) =>
										p === "ellipsis" ? (
											<span
												key={`e-${i}`}
												className="flex size-8 items-center justify-center text-xs text-muted-foreground"
											>
												…
											</span>
										) : (
											<Button
												key={p}
												variant={p === page ? "secondary" : "ghost"}
												size="sm"
												className="text-xs"
												onClick={() => {
													setPage(p);
													window.scrollTo({ top: 0, behavior: "smooth" });
												}}
											>
												{p}
											</Button>
										),
									)}

									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setPage((p) => Math.min(maxPage, p + 1));
											window.scrollTo({ top: 0, behavior: "smooth" });
										}}
										disabled={page >= maxPage}
									>
										›
									</Button>
								</>
							)}
						</div>

						<div className="flex-1 shrink-0 min-w-0" aria-hidden />
					</div>
				)}
			</div>

			{metadata && (
				<aside className="lg:sticky top-14 sm:top-20 w-full shrink-0 lg:w-64 order-first lg:order-0">
					<div className="flex flex-col gap-3">
						<div className="flex flex-wrap items-center justify-between gap-2">
							{/* <div className="flex flex-wrap items-center gap-1.5">
								{filterType && (
									<Badge
										variant="secondary"
										className="cursor-pointer rounded-full px-2 py-0 text-[10px] font-normal"
										onClick={() => setFilterType(null)}
									>
										Type:{" "}
										{filterType === "MaterialItem"
											? "Crafting Materials"
											: filterType === "IngredientItem"
												? "Crafting Ingredients"
												: filterType === "DungeonKeyItem"
													? "Keys"
													: filterType === "MountItem"
														? "Mount"
														: filterType === "EnchanterItem"
															? "Enchanter"
															: filterType === "OtherItem"
																? "Other"
																: filterType}{" "}
										×
									</Badge>
								)}
								{Object.entries(filterAdvanced)
									.filter(([k]) => k.toLowerCase() !== "attackspeed")
									.map(([k, v]) => (
										<Badge
											key={k}
											variant="secondary"
											className="cursor-pointer rounded-full px-2 py-0 text-[10px] font-normal"
											onClick={() =>
												setFilterAdvanced((prev) => {
													const next = { ...prev };
													delete next[k];
													return next;
												})
											}
										>
											{k}: {v} ×
										</Badge>
									))}
								{filterTierItem && (
									<Badge
										variant="secondary"
										className="cursor-pointer rounded-full px-2 py-0 text-[10px] font-normal"
										onClick={() => setFilterTierItem(null)}
									>
										Rarity: {filterTierItem} ×
									</Badge>
								)}
								{filterIngredientTier && (
									<Badge
										variant="secondary"
										className="cursor-pointer rounded-full px-2 py-0 text-[10px] font-normal"
										onClick={() => setFilterIngredientTier(null)}
									>
										Tier: {filterIngredientTier} ×
									</Badge>
								)}
								{(filterLevelMin != null || filterLevelMax != null) && (
									<Badge
										variant="secondary"
										className="cursor-pointer rounded-full px-2 py-0 text-[10px] font-normal"
										onClick={() => {
											setFilterLevelMin(null);
											setFilterLevelMax(null);
											setLevelMinInput("");
											setLevelMaxInput("");
										}}
									>
										Level: {filterLevelMin ?? "—"}–{filterLevelMax ?? "—"} ×
									</Badge>
								)}
							</div> */}
						</div>
						<Collapsible
							defaultOpen={false}
							className="group rounded-md border border-border/40"
						>
							<CollapsibleTrigger className="flex h-10 w-full items-center font-sans justify-between gap-1.5 rounded-md px-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
								<span className="flex items-center gap-1.5 text-md">
									Filters
									{(filterLevelMin != null ||
										filterLevelMax != null ||
										filterTierItem ||
										filterIngredientTier) && (
										<Badge
											variant="outline"
											className="rounded-full px-1.5 py-0 text-[10px] font-normal capitalize pointer-events-none border-green-500/70 text-green-600 dark:text-green-400"
										>
											Active
										</Badge>
									)}
								</span>
								<ChevronDown
									className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
									aria-hidden
								/>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<div className="flex flex-col gap-2 py-2 pl-2">
									<div className="flex flex-col items-start gap-1.5">
										<span className="text-sm font-medium  shrink-0">
											Level Range:
										</span>
										<div className="flex flex-wrap items-center gap-2">
											<Input
												type="number"
												placeholder="Min"
												min={0}
												max={metadata?.filters?.levelRange?.items ?? 110}
												value={levelMinInput}
												onChange={(e) => setLevelMinInput(e.target.value)}
												className="h-9 w-20 min-w-16 sm:h-8"
											/>
											<Input
												type="number"
												placeholder="Max"
												min={0}
												max={metadata?.filters?.levelRange?.items ?? 110}
												value={levelMaxInput}
												onChange={(e) => setLevelMaxInput(e.target.value)}
												className="h-9 w-20 min-w-16 sm:h-8"
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="h-8 w-8 p-0"
												aria-label="Apply level filter"
												onClick={() => {
													const min = levelMinInput.trim()
														? parseInt(levelMinInput, 10)
														: null;
													const max = levelMaxInput.trim()
														? parseInt(levelMaxInput, 10)
														: null;
													setFilterLevelMin(
														min != null && !Number.isNaN(min) ? min : null,
													);
													setFilterLevelMax(
														max != null && !Number.isNaN(max) ? max : null,
													);
												}}
											>
												<Check className="size-4" />
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="h-8 w-8 p-0"
												aria-label="Clear filters"
												onClick={() => {
													setLevelMinInput("");
													setLevelMaxInput("");
													setFilterLevelMin(null);
													setFilterLevelMax(null);
													setFilterTierItem(null);
													setFilterIngredientTier(null);
												}}
											>
												<X className="size-4" />
											</Button>
										</div>
									</div>
									{metadata.filters.tier?.items?.length > 0 && (
										<div className="flex flex-col items-start gap-1.5">
											<span className="text-sm font-medium shrink-0">
												Rarity:
											</span>
											<div className="flex flex-1 flex-wrap items-center gap-1.5">
												{metadata.filters.tier.items.map((v) => {
													const isSelected = filterTierItem === v;
													return (
														<Button
															key={v}
															type="button"
															variant={isSelected ? "default" : "outline"}
															size="sm"
															className={cn(
																"h-7 text-sm capitalize",
																isSelected && "bg-white text-black",
															)}
															onClick={() => {
																setFilterTierItem(isSelected ? null : v);
															}}
														>
															{v}
														</Button>
													);
												})}
											</div>
										</div>
									)}
									{metadata.filters.tier?.ingredients?.length > 0 && (
										<div className="flex flex-col items-start gap-1.5">
											<span className="text-sm font-medium shrink-0">
												Material/Ingredient Tier:
											</span>
											<div className="flex flex-1 flex-wrap items-center gap-1.5">
												{metadata.filters.tier.ingredients.map((v) => {
													const val = String(v);
													const isSelected = filterIngredientTier === val;
													return (
														<Button
															key={v}
															type="button"
															variant={isSelected ? "default" : "outline"}
															size="sm"
															className={cn(
																"h-7 text-sm",
																isSelected && "bg-white text-black",
															)}
															onClick={() => {
																setFilterIngredientTier(
																	isSelected ? null : val,
																);
															}}
														>
															Tier {v}
														</Button>
													);
												})}
											</div>
										</div>
									)}
								</div>
							</CollapsibleContent>
						</Collapsible>
						<div className="flex flex-col gap-2">
							<Collapsible
								defaultOpen
								className="group rounded-md border border-border/40"
							>
								<CollapsibleTrigger className="flex h-10 w-full items-center justify-between font-sans gap-1.5 rounded-md px-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
									<span className="text-md">Browse by Category</span>
									<ChevronDown
										className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
										aria-hidden
									/>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div className="flex flex-col gap-2 py-2 pl-2">
										<Button
											type="button"
											variant={
												filterType === "gearItem" ? "default" : "outline"
											}
											size="sm"
											className={cn(
												"w-full justify-start text-sm h-10",
												filterType === "gearItem" && "bg-white text-black ",
											)}
											onClick={(e) => {
												e.stopPropagation();
												setFilterType(
													filterType === "gearItem" ? null : "gearItem",
												);
												setFilterAdvanced({});
											}}
										>
											All Categories
										</Button>
										{metadata.filters.advanced &&
											Object.entries(metadata.filters.advanced)
												.filter(
													([advKey]) =>
														advKey.toLowerCase() !== "attackspeed" &&
														advKey.toLowerCase() !== "tool" &&
														advKey.toLowerCase() !== "crafting" &&
														advKey.toLowerCase() !== "gathering" &&
														advKey.toLowerCase() !== "tome",
												)
												.map(
													([advKey, values]) =>
														Array.isArray(values) &&
														values.length > 0 && (
															<Collapsible
																key={advKey}
																defaultOpen={false}
																className="group/cat rounded-md border border-border/40"
															>
																<CollapsibleTrigger
																	className={cn(
																		"flex h-10 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-white/5 px-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
																		filterType === advKey ||
																			filterAdvanced[advKey]
																			? "group-data-[state=closed]/cat:border-transparent group-data-[state=closed]/cat:bg-white group-data-[state=closed]/cat:text-black group-data-[state=closed]/cat:hover:bg-white group-data-[state=closed]/cat:hover:text-black"
																			: " ",
																	)}
																>
																	<span className="capitalize">{advKey}</span>
																	<ChevronDown
																		className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/cat:rotate-180"
																		aria-hidden
																	/>
																</CollapsibleTrigger>
																<CollapsibleContent>
																	<div className="flex flex-col w-full items-center gap-1.5 py-2 pl-2">
																		{metadata.filters.type?.includes(
																			advKey,
																		) && (
																			<Button
																				type="button"
																				variant={
																					filterType === advKey
																						? "default"
																						: "ghost"
																				}
																				size="sm"
																				className={cn(
																					" h-10 justify-start w-full text-sm",
																					filterType === advKey &&
																						"bg-white text-black",
																				)}
																				onClick={(e) => {
																					e.stopPropagation();
																					setFilterType(
																						filterType === advKey
																							? null
																							: advKey,
																					);
																					setFilterAdvanced({});
																				}}
																			>
																				All
																			</Button>
																		)}
																		{values.map((v) => {
																			const isSelected =
																				filterAdvanced[advKey] === v;
																			return (
																				<Button
																					key={v}
																					type="button"
																					variant={
																						isSelected ? "default" : "ghost"
																					}
																					size="sm"
																					className={cn(
																						" h-10 justify-start w-full text-sm capitalize",
																						isSelected && "bg-white text-black",
																					)}
																					onClick={() => {
																						if (isSelected) {
																							setFilterAdvanced((prev) => {
																								const next = { ...prev };
																								delete next[advKey];
																								return next;
																							});
																						} else {
																							setFilterType(null);
																							setFilterAdvanced({
																								[advKey]: v,
																							});
																						}
																					}}
																				>
																					{v}
																				</Button>
																			);
																		})}
																	</div>
																</CollapsibleContent>
															</Collapsible>
														),
												)}
										<Button
											type="button"
											variant={
												filterType === "MaterialItem" ? "default" : "outline"
											}
											size="sm"
											className={cn(
												"w-full justify-start text-sm h-10",
												filterType === "MaterialItem" && "bg-white text-black ",
											)}
											onClick={(e) => {
												e.stopPropagation();
												setFilterType(
													filterType === "MaterialItem" ? null : "MaterialItem",
												);
												setFilterAdvanced({});
											}}
										>
											Crafting Materials
										</Button>
										<Button
											type="button"
											variant={
												filterType === "IngredientItem" ? "default" : "outline"
											}
											size="sm"
											className={cn(
												"w-full justify-start text-sm h-10",
												filterType === "IngredientItem" &&
													"bg-white text-black ",
											)}
											onClick={(e) => {
												e.stopPropagation();
												setFilterType(
													filterType === "IngredientItem"
														? null
														: "IngredientItem",
												);
												setFilterAdvanced({});
											}}
										>
											Crafting Ingredients
										</Button>
										<Button
											type="button"
											variant={
												filterType === "MountItem" ? "default" : "outline"
											}
											size="sm"
											className={cn(
												"w-full justify-start text-sm h-10",
												filterType === "MountItem" && "bg-white text-black ",
											)}
											onClick={(e) => {
												e.stopPropagation();
												setFilterType(
													filterType === "MountItem" ? null : "MountItem",
												);
												setFilterAdvanced({});
											}}
										>
											Mount
										</Button>
										<Button
											type="button"
											variant={
												filterType === "EnchanterItem" ? "default" : "outline"
											}
											size="sm"
											className={cn(
												"w-full justify-start text-sm h-10",
												filterType === "EnchanterItem" &&
													"bg-white text-black ",
											)}
											onClick={(e) => {
												e.stopPropagation();
												setFilterType(
													filterType === "EnchanterItem"
														? null
														: "EnchanterItem",
												);
												setFilterAdvanced({});
											}}
										>
											Enchanter
										</Button>
										<Button
											type="button"
											variant={
												filterType === "OtherItem" ? "default" : "outline"
											}
											size="sm"
											className={cn(
												"w-full justify-start text-sm h-10",
												filterType === "OtherItem" && "bg-white text-black ",
											)}
											onClick={(e) => {
												e.stopPropagation();
												setFilterType(
													filterType === "OtherItem" ? null : "OtherItem",
												);
												setFilterAdvanced({});
											}}
										>
											Other
										</Button>
										<Button
											type="button"
											variant={
												filterType === "DungeonKeyItem" ? "default" : "outline"
											}
											size="sm"
											className={cn(
												"w-full justify-start text-sm h-10",
												filterType === "DungeonKeyItem" &&
													"bg-white text-black ",
											)}
											onClick={(e) => {
												e.stopPropagation();
												setFilterType(
													filterType === "DungeonKeyItem"
														? null
														: "DungeonKeyItem",
												);
												setFilterAdvanced({});
											}}
										>
											Key
										</Button>
									</div>
								</CollapsibleContent>
							</Collapsible>

							{/* {metadata.filters.identifications?.length > 0 && (
								<div className="flex flex-wrap items-center gap-1.5">
									<span className="text-[10px] text-muted-foreground shrink-0">
										identifications:
									</span>
									{metadata.filters.identifications.slice(0, 20).map((v) => (
										<Badge
											key={v}
											variant="outline"
											className="rounded-full px-2 py-0 text-[10px] font-normal"
										>
											{v}
										</Badge>
									))}
									{metadata.filters.identifications.length > 20 && (
										<Badge
											variant="outline"
											className="rounded-full px-2 py-0 text-[10px] font-normal"
										>
											+{metadata.filters.identifications.length - 20} more
										</Badge>
									)}
								</div>
							)}
							{metadata.majorIds?.length > 0 && (
								<div className="flex flex-wrap items-center gap-1.5">
									<span className="text-[10px] text-muted-foreground shrink-0">
										majorIds:
									</span>
									{metadata.majorIds.slice(0, 15).map((v) => (
										<Badge
											key={v}
											variant="outline"
											className="rounded-full px-2 py-0 text-[10px] font-normal"
										>
											{v}
										</Badge>
									))}
									{metadata.majorIds.length > 15 && (
										<Badge
											variant="outline"
											className="rounded-full px-2 py-0 text-[10px] font-normal"
										>
											+{metadata.majorIds.length - 15} more
										</Badge>
									)}
								</div>
							)}
							{metadata.static && Object.keys(metadata.static).length > 0 && (
								<div className="flex flex-wrap items-center gap-1.5">
									<span className="text-[10px] text-muted-foreground shrink-0">
										static:
									</span>
									{Object.entries(metadata.static).map(([k, v]) => (
										<Badge
											key={k}
											variant="outline"
											className="rounded-full px-2 py-0 text-[10px] font-normal"
										>
											{k}: {v}
										</Badge>
									))}
								</div>
							)} */}
						</div>
					</div>
				</aside>
			)}
		</div>
	);
}
