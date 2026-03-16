"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useTradeMarketStore } from "@/store/trademarket-store";
import type {
	MergedPopularEntry,
	MergedNewlyListedEntry,
} from "@/types/wynnventory/trademarket";
import type { ItemEntry } from "@/types/item";
import { ItemIcon } from "@/lib/item-icons";
import { ItemSearchInput } from "@/components/items/item-search-input";
import { EmeraldPrice } from "@/components/emerald-price";
import { cn, tierRoman, formatTimeElapsed } from "@/lib/utils";
import { getRarityStyles } from "@/lib/rarity-color";

const PAGE_SIZE = 50;

function getItemTypeDisplay(item: ItemEntry | undefined): string | undefined {
	if (!item) return undefined;
	const withExtras = item as ItemEntry & { weaponType?: string };
	if (withExtras.weaponType)
		return withExtras.weaponType.replace(/([A-Z])/g, " $1").trim();
	if (item.type?.toLowerCase() === "armour" || item.type?.toLowerCase() === "armor")
		return (item.armourType ?? item.subType)?.replace(/([A-Z])/g, " $1").trim();
	return item.type?.replace(/([A-Z])/g, " $1").trim();
}

const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute

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

const POWDER_TYPES = ["fire", "water", "air", "thunder", "earth"];
const CORKIAN_TYPES = ["amplifier", "insulator", "simulator"];

/** Detect enchanter subtype: rune, powder, corkian, or key */
function getEnchanterSubType(
	name: string,
	wynnInv?: { item_type?: string; type?: string; rarity?: string },
): "rune" | "powder" | "corkian" | "key" | null {
	const n = name.toLowerCase();
	const itemType = wynnInv?.item_type?.toLowerCase() ?? wynnInv?.type?.toLowerCase() ?? "";

	if (n.includes("rune") || itemType.includes("rune")) return "rune";
	if (n.includes("key") || itemType.includes("key")) return "key";

	for (const p of POWDER_TYPES) {
		if (n.startsWith(p) || n.includes(` ${p} `) || n === `${p} powder`) return "powder";
	}
	if (n.includes("powder") || itemType.includes("powder")) return "powder";

	if (n.includes("corkian")) return "corkian";
	for (const c of CORKIAN_TYPES) {
		if (n.includes(c)) return "corkian";
	}

	return null;
}

/** Detect if item is rune, key, powder, or corkian (not in Wynncraft item DB) */
function isEnchanterItem(
	name: string,
	wynnInv?: { item_type?: string; type?: string; rarity?: string },
): boolean {
	return getEnchanterSubType(name, wynnInv) != null;
}

/** Create mock wynn{} for runes, keys, powders, corkian – type: enchanter, subType: rune|powder|corkian|key */
function createMockWynnForEnchanterItem(
	name: string,
	tier: number | null,
	wynnInv?: { item_type?: string; type?: string; rarity?: string },
): ItemEntry {
	const subType = getEnchanterSubType(name, wynnInv) ?? "key";
	const rarity = wynnInv?.rarity ?? "common";
	return {
		internalName: tier != null ? `${name} ${tierRoman(tier)}` : name,
		type: "enchanter",
		subType: subType.charAt(0).toUpperCase() + subType.slice(1),
		rarity,
	};
}

/** Resolve wynn data: real from itemDb, or mock for enchanter items (rune/key/powder/corkian) */
function resolveWynnData(
	itemDb: Record<string, ItemEntry>,
	name: string,
	tier: number | null,
	wynnInv?: { item_type?: string; type?: string; rarity?: string },
): ItemEntry | undefined {
	const wynn = getWynnItem(itemDb, name, tier);
	if (wynn) return wynn;
	if (isEnchanterItem(name, wynnInv)) {
		return createMockWynnForEnchanterItem(name, tier, wynnInv);
	}
	return undefined;
}

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
	useEffect(() => {
		setPage(1);
	}, [tab]);

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

	const mergedPopular = useMemo((): MergedPopularEntry[] => {
		let result = ranking
			.sort((a, b) => b.total_count - a.total_count);
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
	}, [ranking, itemDb, appliedSearch]);

	const mergedNewlyListed = useMemo((): MergedNewlyListedEntry[] => {
		let result = listings;
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
	}, [listings, itemDb, appliedSearch]);

	const filtered =
		tab === "popular" ? mergedPopular : mergedNewlyListed;
	const isRankingData = tab === "popular";

	useEffect(() => {
		console.log("Trade market item data:", filtered);
	}, [filtered]);

	const total = filtered.length;
	const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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

	return (
		<div className="flex flex-col gap-6 lg:flex-row">
			{/* Main content */}
			<div className="min-w-0 flex-1 space-y-4">
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex rounded-lg border border-border/50 p-0.5">
						<button
							type="button"
								onClick={() => setTab("popular")}
								className={cn(
									"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
									"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
									tab === "newly_listed"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								Newly Listed
							</button>
						</div>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-2">
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
								className="flex-1 sm:max-w-lg"
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setAppliedSearch(searchQuery.trim());
									setPage(1);
								}}
							>
								<Search className="size-4" />
								Search
							</Button>
						</div>


				<div className="flex items-center gap-2">
							{maxPage > 1 && (
								<div className="flex items-center gap-0.5 ml-1">
									<Button
										variant="outline"
										size="sm"
										className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
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
										className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
										disabled={page >= maxPage}
									>
										{">"}
									</Button>
								</div>
							)}
					<Button
						variant="outline"
						size="sm"
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

			{error && (
				<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			)}

				{loading || (tab === "newly_listed" && loadingListings) ? (
				<div className="space-y-2">
					{Array.from({ length: 15 }).map((_, i) => (
						<Skeleton key={i} className="h-10 rounded-md" />
					))}
				</div>
				) : pageItems.length > 0 ? (
				<Table>
					<TableHeader>
								<TableRow>
							<TableHead>Name</TableHead>
									<TableHead className="text-right">
										{isRankingData ? "Lowest" : "Price"}
									</TableHead>
									{isRankingData && (
										<>
											<TableHead className="text-right">Average</TableHead>
											<TableHead className="w-24 text-right">Quantity</TableHead>
										</>
									)}
									{!isRankingData && (
										<TableHead className="text-right">Listed</TableHead>
									)}
						</TableRow>
					</TableHeader>
					<TableBody>
								{isRankingData
									? pageItems.map((entry) => {
										const m = entry as MergedPopularEntry;
										const { wynn, wynnInv } = m.completedData;
										const raw = wynn?.rarity ?? "";
										const rarity = raw
											? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
											: "";
										const { text } = getRarityStyles(rarity);
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
												<TableCell className={cn("flex items-center gap-2 font-sans")}>
													<ItemIcon item={wynn ?? m.name} alt={m.name} />
													<div className="min-w-0">
														<span className={cn("text-lg font-medium group-hover:underline")}>
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
												<TableCell className="text-right font-mono">
													<EmeraldPrice price={wynnInv.average_price} size="lg" />
												</TableCell>
												<TableCell className="text-right text-lg tabular-nums font-mono">
													{wynnInv.total_count.toLocaleString()}
												</TableCell>
											</TableRow>
										);
									})
									: pageItems.map((entry) => {
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
												<TableCell className={cn("flex items-center gap-2 font-sans")}>
													<ItemIcon
														item={
															wynn ??
															(typeof wynnInv.listing.icon?.value === "string"
																? wynnInv.listing.icon.value
																: m.name)
														}
														alt={m.name}
													/>
													<div className="min-w-0">
														<span className={cn("text-lg font-medium group-hover:underline")}>
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
												<TableCell className="text-right text-muted-foreground text-sm">
													{formatTimeElapsed(wynnInv.timestamp)}
												</TableCell>
											</TableRow>
										);
									})}
					</TableBody>
				</Table>
			) : (
				<p className="py-20 text-center text-sm text-muted-foreground">
					No items found.
				</p>
			)}

			{!loading && maxPage > 1 && (
					<div className="flex items-center justify-center gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
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
								onClick={() => setPage(p)}
							>
								{p}
							</Button>
						),
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
						disabled={page >= maxPage}
					>
						›
					</Button>


				</div>
			)}
			</div>
		</div>
	);
}
