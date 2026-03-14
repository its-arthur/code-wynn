"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Loader2, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getTradeRanking } from "@/api/wynnventory/trademarket";
import { getItemDatabaseFull } from "@/api/item";
import type { TradeRankingEntry } from "@/types/wynnventory/trademarket";
import type { ItemDatabase, ItemEntry } from "@/types/item";
import { wynnItemGuideUrl } from "@/lib/wynn-cdn";
import { EmeraldPrice } from "@/components/emerald-price";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 30;

/** Category filter: type (and optional subType for armour/weapon/accessory) */
const CATEGORIES: {
	label: string;
	type?: string;
	subTypes?: { value: string; label: string }[];
}[] = [
	{ label: "All Categories" },
	{
		label: "Armor",
		type: "armour",
		subTypes: [
			{ value: "all", label: "All" },
			{ value: "helmet", label: "Helmet" },
			{ value: "chestplate", label: "Chestplate" },
			{ value: "leggings", label: "Leggings" },
			{ value: "boots", label: "Boots" },
		],
	},
	{
		label: "Weapon",
		type: "weapon",
		subTypes: [
			{ value: "all", label: "All" },
			{ value: "wand", label: "Wand" },
			{ value: "spear", label: "Spear" },
			{ value: "bow", label: "Bow" },
			{ value: "dagger", label: "Dagger" },
			{ value: "relik", label: "Relik" },
		],
	},
	{
		label: "Accessory",
		type: "accessory",
		subTypes: [
			{ value: "all", label: "All" },
			{ value: "ring", label: "Ring" },
			{ value: "bracelet", label: "Bracelet" },
			{ value: "necklace", label: "Necklace" },
		],
	},
	{ label: "Crafting Material", type: "crafting" },
	{ label: "Crafting Ingredient", type: "ingredient" },
	{ label: "Mounts", type: "mount" },
	{ label: "Enhancer", type: "enhancer" },
	{ label: "Key", type: "key" },
	{ label: "Other", type: "other" },
];

function getIconName(entry: ItemEntry | undefined): string | null {
	if (!entry?.icon?.value) return null;
	if (typeof entry.icon.value === "string") return entry.icon.value;
	return entry.icon.value.name ?? null;
}

function ItemIcon({ name, item }: { name: string; item?: ItemEntry }) {
	const [err, setErr] = useState(false);
	const iconName = getIconName(item);

	if (!iconName || err) {
		return (
			<span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted/60 text-[10px] text-muted-foreground">
				?
			</span>
		);
	}

	return (
		<img
			src={wynnItemGuideUrl(iconName)}
			alt={name}
			className="size-8 shrink-0 object-contain"
			loading="lazy"
			onError={() => setErr(true)}
		/>
	);
}

const TYPE_ALIASES: Record<string, string[]> = {
	crafting: ["crafting", "material"],
};

function matchesCategory(
	item: ItemEntry | undefined,
	categoryType: string | undefined,
	subType: string | undefined,
): boolean {
	if (!categoryType || categoryType === "all") return true;
	if (!item?.type) return false;

	const itemType = item.type.toLowerCase();
	const aliases = TYPE_ALIASES[categoryType] ?? [categoryType.toLowerCase()];
	const matchType = aliases.includes(itemType);

	if (!subType || subType === "all") return matchType;
	if (!item.subType) return matchType;

	const itemSub = item.subType.toLowerCase();
	return matchType && itemSub === subType.toLowerCase();
}

export default function TradeMarketPage() {
	const [ranking, setRanking] = useState<TradeRankingEntry[]>([]);
	const [itemDb, setItemDb] = useState<ItemDatabase>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [category, setCategory] = useState<{ type?: string; subType?: string }>({
		type: undefined,
		subType: undefined,
	});
	const [categoryOpen, setCategoryOpen] = useState(true);

	const fetchRanking = useCallback(() => {
		setLoading(true);
		setError(null);
		Promise.all([getTradeRanking(), getItemDatabaseFull()])
			.then(([rankData, dbData]) => {
				setRanking(rankData);
				setItemDb(dbData);
			})
			.catch((e) =>
				setError(e instanceof Error ? e.message : "Failed to load"),
			)
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		fetchRanking();
	}, [fetchRanking]);

	const filtered = useMemo(() => {
		let result = ranking;

		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter((r) => r.name.toLowerCase().includes(q));
		}

		if (category.type) {
			result = result.filter((r) =>
				matchesCategory(itemDb[r.name], category.type, category.subType),
			);
		}

		return result;
	}, [ranking, searchQuery, category, itemDb]);

	useEffect(() => {
		setPage(1);
	}, [searchQuery, category]);

	const categoryCounts = useMemo(() => {
		const counts: Record<string, number> = { all: ranking.length };
		for (const c of CATEGORIES) {
			if (!c.type) continue;
			const n = ranking.filter((r) =>
				matchesCategory(itemDb[r.name], c.type, undefined),
			).length;
			counts[c.type] = n;
		}
		return counts;
	}, [ranking, itemDb]);

	const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
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
			{/* Filters sidebar */}
			<aside className="w-full shrink-0 lg:w-56">
				<Collapsible open={categoryOpen} onOpenChange={setCategoryOpen}>
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted/50"
						>
							Browse by Category
							{categoryOpen ? (
								<ChevronUp className="size-4" />
							) : (
								<ChevronDown className="size-4" />
							)}
						</button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<nav className="mt-2 space-y-0.5">
							{CATEGORIES.map((c) => {
								if (c.subTypes && c.type) {
									const isExpanded = category.type === c.type;
									const count = categoryCounts[c.type] ?? 0;
									return (
										<div key={c.type}>
											<button
												type="button"
												onClick={() =>
													setCategory({
														type: c.type,
														subType: "all",
													})
												}
												className={cn(
													"flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm",
													category.type === c.type
														? "bg-primary/20 text-primary"
														: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
												)}
											>
												{c.label}
												<span className="tabular-nums">{count}</span>
											</button>
											{isExpanded && (
												<div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
													{c.subTypes.map((st) => {
														const subActive =
															category.subType === st.value;
														return (
															<button
																key={st.value}
																type="button"
																onClick={() =>
																	setCategory({
																		type: c.type,
																		subType: st.value,
																	})
																}
																className={cn(
																	"block w-full rounded px-2 py-1 text-left text-xs",
																	subActive
																		? "bg-primary/20 text-primary"
																		: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
																)}
															>
																{st.label}
															</button>
														);
													})}
												</div>
											)}
										</div>
									);
								}
								const isActive = category.type === c.type && !category.subType;
								const count = c.type ? (categoryCounts[c.type] ?? 0) : 0;
								return (
									<button
										key={c.type ?? "all"}
										type="button"
										onClick={() =>
											setCategory(
												c.type
													? { type: c.type, subType: undefined }
													: { type: undefined, subType: undefined },
											)
										}
										className={cn(
											"flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm",
											isActive
												? "bg-primary/20 text-primary"
												: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
										)}
									>
										{c.label}
										{c.type ? (
											<span className="tabular-nums">{count}</span>
										) : null}
									</button>
								);
							})}
						</nav>
					</CollapsibleContent>
				</Collapsible>
			</aside>

			{/* Main content */}
			<div className="min-w-0 flex-1 space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1 sm:max-w-xs">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search items..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 pr-8"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="size-3.5" />
						</button>
					)}
				</div>

				<div className="flex items-center gap-2">
					{!loading && (
						<p className="text-sm text-muted-foreground">
							{filtered.length.toLocaleString()} items
							{searchQuery.trim() && ` matching "${searchQuery.trim()}"`}
						</p>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={fetchRanking}
						disabled={loading}
					>
						{loading ? (
							<Loader2 className="animate-spin" />
						) : (
							<RefreshCw />
						)}
						Refresh
					</Button>
				</div>
			</div>

			{error && (
				<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 15 }).map((_, i) => (
						<Skeleton key={i} className="h-10 rounded-md" />
					))}
				</div>
			) : pageItems.length > 0 ? (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12 text-center">#</TableHead>
							<TableHead>Name</TableHead>
							<TableHead className="text-right">Lowest</TableHead>
							<TableHead className="text-right">Average</TableHead>
							<TableHead className="w-24 text-right">Quantity</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{pageItems.map((entry) => (
							<TableRow key={entry.name} className="group">
								<TableCell className="text-center text-xs text-muted-foreground tabular-nums">
									{entry.rank}
								</TableCell>
								<TableCell>
									<Link
										href={`/trademarket/${encodeURIComponent(entry.name)}`}
										className="flex items-center gap-2 font-medium text-sm hover:underline"
									>
										<ItemIcon name={entry.name} item={itemDb[entry.name]} />
										{entry.name}
									</Link>
								</TableCell>
								<TableCell className="text-right">
									<EmeraldPrice price={entry.lowest_price} />
								</TableCell>
								<TableCell className="text-right">
									<EmeraldPrice price={entry.average_price} />
								</TableCell>
								<TableCell className="text-right text-xs tabular-nums">
									{entry.total_count.toLocaleString()}
								</TableCell>
							</TableRow>
						))}
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
