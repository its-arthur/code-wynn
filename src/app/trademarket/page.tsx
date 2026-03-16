"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, RefreshCw, Search } from "lucide-react";
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

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

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
	const [pageSize, setPageSize] = useState(50);
	const [sortKey, setSortKey] = useState<"name" | "lowest" | "average" | "quantity" | "price" | "listed">("quantity");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	useEffect(() => {
		setPage(1);
		setSortKey(tab === "popular" ? "quantity" : "listed");
		setSortDir("desc");
	}, [tab]);
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

	const sortedFiltered = useMemo(() => {
		const arr = [...filtered];
		const dir = sortDir === "asc" ? 1 : -1;
		arr.sort((a, b) => {
			if (sortKey === "name") {
				const na = (a as MergedPopularEntry | MergedNewlyListedEntry).name.toLowerCase();
				const nb = (b as MergedPopularEntry | MergedNewlyListedEntry).name.toLowerCase();
				return dir * na.localeCompare(nb);
			}
			if (isRankingData) {
				const ea = a as MergedPopularEntry;
				const eb = b as MergedPopularEntry;
				if (sortKey === "lowest") return dir * (ea.completedData.wynnInv.lowest_price - eb.completedData.wynnInv.lowest_price);
				if (sortKey === "average") return dir * (ea.completedData.wynnInv.average_price - eb.completedData.wynnInv.average_price);
				if (sortKey === "quantity") return dir * (ea.completedData.wynnInv.total_count - eb.completedData.wynnInv.total_count);
			} else {
				const ea = a as MergedNewlyListedEntry;
				const eb = b as MergedNewlyListedEntry;
				if (sortKey === "price") return dir * (ea.completedData.wynnInv.listing_price - eb.completedData.wynnInv.listing_price);
				if (sortKey === "listed") return dir * (new Date(ea.completedData.wynnInv.timestamp).getTime() - new Date(eb.completedData.wynnInv.timestamp).getTime());
			}
			return 0;
		});
		return arr;
	}, [filtered, sortKey, sortDir, isRankingData]);

	const total = sortedFiltered.length;
	const maxPage = Math.max(1, Math.ceil(total / pageSize));
	const pageItems = sortedFiltered.slice((page - 1) * pageSize, page * pageSize);

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
		if (sortKey !== column) return <ArrowUpDown className="ml-1 size-3.5 opacity-50" />;
		return sortDir === "asc" ? <ArrowUp className="ml-1 size-3.5" /> : <ArrowDown className="ml-1 size-3.5" />;
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
								onEnterSubmit={(v) => {
									setAppliedSearch(v.trim());
									setPage(1);
								}}
								onClear={() => setAppliedSearch("")}
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

				<Table>
					<TableHeader>
								<TableRow>
							<TableHead>
								<button
									type="button"
									className="flex items-center hover:text-foreground"
									onClick={() => toggleSort("name")}
								>
									Name
									<SortIcon column="name" />
								</button>
							</TableHead>
									<TableHead className="text-right">
								<button
									type="button"
									className="ml-auto flex items-center justify-end hover:text-foreground"
									onClick={() => toggleSort(isRankingData ? "lowest" : "price")}
								>
									{isRankingData ? "Lowest" : "Price"}
									<SortIcon column={isRankingData ? "lowest" : "price"} />
								</button>
									</TableHead>
									{isRankingData && (
										<>
									<TableHead className="text-right">
										<button
											type="button"
											className="ml-auto flex items-center justify-end hover:text-foreground"
											onClick={() => toggleSort("average")}
										>
											Average
											<SortIcon column="average" />
										</button>
									</TableHead>
									<TableHead className="w-24 text-right">
										<button
											type="button"
											className="ml-auto flex items-center justify-end hover:text-foreground"
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
										className="ml-auto flex items-center justify-end hover:text-foreground"
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
										<Skeleton className="h-10 w-full rounded-md" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-10 w-full rounded-md" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-10 w-full rounded-md" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-10 w-full rounded-md" />
									</TableCell>
								</TableRow>
							))
						) : pageItems.length > 0 ? (
							isRankingData
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
									})
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
					<div className="flex items-center justify-center gap-2 pt-2 w-full">
						<div className="gap-2 flex font-sans items-center ">
							<p className="text-sm text-muted-foreground">
								Limit:
							</p>
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

						{maxPage > 1 && (
							<>
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
							</>
						)}
				</div>
			)}
			</div>
		</div>
	);
}
