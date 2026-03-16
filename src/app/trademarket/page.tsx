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

	const filteredPopular = useMemo(() => {
		let result = ranking
			.filter((r) => r.lowest_price > 1)
			.sort((a, b) => b.total_count - a.total_count);
		if (appliedSearch.trim()) {
			const q = appliedSearch.trim().toLowerCase();
			result = result.filter(
				(r) =>
					r.name.toLowerCase().includes(q) ||
					(itemDb[r.name]?.type?.toLowerCase().includes(q) ?? false) ||
					(itemDb[r.name]?.subType?.toLowerCase().includes(q) ?? false),
			);
		}
		return result;
	}, [ranking, itemDb, appliedSearch]);

	const filteredNewlyListed = useMemo(() => {
		let result = listings;
		if (appliedSearch.trim()) {
			const q = appliedSearch.trim().toLowerCase();
			result = result.filter(
				(r) =>
					r.name.toLowerCase().includes(q) ||
					(itemDb[r.name]?.type?.toLowerCase().includes(q) ?? false) ||
					(itemDb[r.name]?.subType?.toLowerCase().includes(q) ?? false),
			);
		}
		return result;
	}, [listings, itemDb, appliedSearch]);

	const filtered =
		tab === "popular" ? filteredPopular : filteredNewlyListed;
	const isRankingData = tab === "popular";

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
							{!loading && !loadingListings && (
						<p className="text-sm text-muted-foreground">
									{total.toLocaleString()} items
						</p>
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
						Refresh
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
										const e = entry as (typeof filteredPopular)[number];
										const item = itemDb[e.name];
										const raw = item?.rarity ?? "";
										const rarity = raw
											? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
											: "";
										const { text } = getRarityStyles(rarity);
										return (
											<TableRow
												key={e.name + e.tier}
												className="group cursor-pointer"
												onClick={() => {
													router.push(
														`/trademarket/${encodeURIComponent(e.name)}${e.tier != null ? `?tier=${e.tier}` : ""}`,
													);
												}}
											>
												<TableCell className={cn("flex items-center gap-2 font-sans")}>
													<ItemIcon item={item ?? e.name} alt={e.name} />
													<div className="min-w-0">
														<span className={cn("text-lg font-medium group-hover:underline")}>
															{e.name}
															{e.tier ? ` ${tierRoman(e.tier)}` : ""}
														</span>
														{item && (
															<div
																className={cn(
																	"flex flex-wrap items-center gap-2 text-sm capitalize font-mono truncate",
																	text,
																)}
															>
																{[
																	item.requirements?.level != null &&
																	`Lv.${item.requirements.level}`,
																	rarity,
																	getItemTypeDisplay(item),
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
													<EmeraldPrice price={e.lowest_price} size="lg" />
												</TableCell>
												<TableCell className="text-right font-mono">
													<EmeraldPrice price={e.average_price} size="lg" />
												</TableCell>
												<TableCell className="text-right text-lg tabular-nums font-mono">
													{e.total_count.toLocaleString()}
												</TableCell>
											</TableRow>
										);
									})
									: pageItems.map((entry) => {
										const e = entry as (typeof filteredNewlyListed)[number];
										const item = itemDb[e.name];
										const raw = item?.rarity ?? e.listing?.rarity ?? "";
										const rarity = raw
											? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
											: "";
										const { text } = getRarityStyles(rarity);
										return (
											<TableRow
												key={e.name + e.tier + e.timestamp}
												className="group cursor-pointer"
												onClick={() => {
													router.push(
														`/trademarket/${encodeURIComponent(e.name)}${e.tier != null ? `?tier=${e.tier}` : ""}`,
													);
												}}
											>
												<TableCell className={cn("flex items-center gap-2 font-sans")}>
													<ItemIcon
														item={
															item ??
															(typeof e.listing.icon?.value === "string"
																? e.listing.icon.value
																: e.name)
														}
														alt={e.name}
													/>
													<div className="min-w-0">
														<span className={cn("text-lg font-medium group-hover:underline")}>
															{e.name}
															{e.tier ? ` ${tierRoman(e.tier)}` : ""}
														</span>
														{(item || e.listing) && (
															<div
																className={cn(
																	"flex flex-wrap items-center gap-2 text-sm capitalize font-mono truncate",
																	text,
																)}
															>
																{[
																	item?.requirements?.level != null &&
																	`Lv.${item.requirements.level}`,
																	rarity,
																	getItemTypeDisplay(item ?? undefined),
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
													<EmeraldPrice price={e.listing_price} size="lg" />
												</TableCell>
												<TableCell className="text-right text-muted-foreground text-sm">
													{formatTimeElapsed(e.timestamp)}
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
				<div className="flex items-center justify-center gap-1 pt-2">
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
