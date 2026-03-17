"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { use } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	Loader2,
	RefreshCw,
	TrendingUp,
	TrendingDown,
} from "lucide-react";
import {
	Area,
	Bar,
	CartesianGrid,
	ComposedChart,
	Line,
	XAxis,
	YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import {
	getTradePriceInfo,
	getTradeHistoricDays,
	getTradeListingsForItem,
} from "@/api/wynnventory/trademarket";
import { quickSearchItems } from "@/api/item";
import { useTradeMarketStore } from "@/store/trademarket-store";
import type {
	TradePriceInfo,
	TradeHistoricDay,
	TradeListing,
	StatRoll,
} from "@/types/wynnventory/trademarket";
import type { ItemEntry, ItemIdentification } from "@/types/item";
import { cn, tierRoman } from "@/lib/utils";
import { getRarityStyles } from "@/lib/rarity-color";
import { ItemIcon } from "@/lib/item-icons";
import { EmeraldPrice } from "@/components/emerald-price";

const chartConfig = {
	average_price: { label: "Avg", color: "hsl(142, 71%, 45%)" },
	average_mid_80_percent_price: {
		label: "Mid 80%",
		color: "hsl(217, 91%, 60%)",
	},
	highest_price: { label: "High", color: "hsl(0, 84%, 60%)" },
	lowest_price: { label: "Low", color: "hsl(45, 93%, 47%)" },
	unidentified_average_price: {
		label: "Unid Avg",
		color: "hsl(300, 60%, 60%)",
	},
	total_count: { label: "Volume", color: "hsl(262, 83%, 58%)" },
} satisfies ChartConfig;

type SeriesKey = keyof typeof chartConfig;

const ALL_SERIES: SeriesKey[] = [
	"average_price",
	"average_mid_80_percent_price",
	"highest_price",
	"lowest_price",
	"unidentified_average_price",
	"total_count",
];

const DEFAULT_VISIBLE = new Set<SeriesKey>([
	"average_price",
	"average_mid_80_percent_price",
	"unidentified_average_price",
	"lowest_price",
]);

type DateRange = "7d" | "30d" | "90d";

const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute

function formatPrice(price: number): string {
	if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
	if (price >= 1_000) return `${(price / 1_000).toFixed(1)}K`;
	if (price) return price.toLocaleString();
	return "0";
}

function formatDateFull(dateStr: string): string {
	const d = parseDate(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function parseDate(dateStr: string): Date {
	return new Date(dateStr);
}

function formatDateShort(dateStr: string): string {
	const d = parseDate(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimeShort(dateStr: string): string {
	const d = parseDate(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateTimeFull(dateStr: string): string {
	const d = parseDate(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function getStartDate(range: DateRange): string {
	const d = new Date();
	const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
	d.setDate(d.getDate() - days);
	return d.toISOString().slice(0, 10);
}

function formatTimeElapsed(dateStr: string): string {
	const d = parseDate(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr;
	const now = new Date();
	const ms = now.getTime() - d.getTime();
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	const h = Math.floor(m / 60);
	const d_ = Math.floor(h / 24);
	if (s < 60) return "now";
	if (m < 60) return `${m}m ago`;
	if (h < 24) return `${h}h ago`;
	if (d_ < 7) return `${d_}d ago`;
	return formatDateShort(dateStr);
}

function formatStatRollValue(s: StatRoll): string {
	const val = s.statActualValue?.value ?? s.statRoll;
	if (val == null) return "—";
	const unit = s.unit ?? "";
	const suffix =
		unit === "PERCENT"
			? "%"
			: unit === "PER_5_S"
				? "/5s"
				: unit === "PER_TICK"
					? "/t"
					: "";
	return `${val}${suffix}`;
}

function StatCard({
	label,
	price,
	sub,
}: {
	label: string;
	price: number;
	sub?: string;
}) {
	return (
		<Card className="flex-1">
			<CardContent className="p-4">
				<p className="text-xs text-muted-foreground">{label}</p>
				<div className="mt-1 flex items-center gap-1.5">
					<EmeraldPrice price={price} size="2xl" />
				</div>
				{sub && (
					<p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
				)}
			</CardContent>
		</Card>
	);
}

export default function TradeItemDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ itemName: string }>;
	searchParams: Promise<{ tier?: string }>;
}) {
	const { itemName } = use(params);
	const { tier: tierParam } = use(searchParams);
	const decodedName = decodeURIComponent(itemName);
	const parsedTier = tierParam != null ? parseInt(tierParam, 10) : undefined;
	const tierNum =
		parsedTier != null && !Number.isNaN(parsedTier) ? parsedTier : undefined;

	const { itemDb: cachedItemDb } = useTradeMarketStore();
	const [itemEntry, setItemEntry] = useState<ItemEntry | null>(
		() => cachedItemDb[decodedName] ?? null,
	);
	const [priceInfo, setPriceInfo] = useState<TradePriceInfo | null>(null);
	const [history, setHistory] = useState<TradeHistoricDay[]>([]);
	const [listings, setListings] = useState<TradeListing[]>([]);
	const [listingsPage, setListingsPage] = useState(1);
	const [listingsTotal, setListingsTotal] = useState(0);
	const [listingsPageSize, setListingsPageSize] = useState(10);
	const [listingsTab, setListingsTab] = useState<"identified" | "unidentified">(
		"identified",
	);
	const [dateRange, setDateRange] = useState<DateRange>("30d");

	const listingsCache = useRef<
		Map<string, { items: TradeListing[]; total: number; fetchedAt: number }>
	>(new Map());
	const [visibleSeries, setVisibleSeries] = useState<Set<SeriesKey>>(
		new Set(DEFAULT_VISIBLE),
	);

	function toggleSeries(key: SeriesKey) {
		setVisibleSeries((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}

	const [loadingPrice, setLoadingPrice] = useState(true);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [loadingListings, setLoadingListings] = useState(true);
	const [errorPrice, setErrorPrice] = useState<string | null>(null);
	const [errorHistory, setErrorHistory] = useState<string | null>(null);
	const [errorListings, setErrorListings] = useState<string | null>(null);

	// Use cached itemDb immediately when navigating from list; fallback to API for direct visits
	useEffect(() => {
		const cached = cachedItemDb[decodedName];
		if (cached) {
			setItemEntry(cached);
			return;
		}
		quickSearchItems(decodedName)
			.then((db) => {
				const entry = db[decodedName] ?? Object.values(db)[0];
				if (entry) setItemEntry(entry);
			})
			.catch(() => {});
	}, [decodedName, cachedItemDb]);

	const fetchPrice = useCallback(
		(background = false) => {
			if (!background) {
				setLoadingPrice(true);
				setErrorPrice(null);
			}
			getTradePriceInfo(
				decodedName,
				tierNum != null ? { tier: tierNum } : undefined,
			)
				.then(setPriceInfo)
				.catch((e) =>
					setErrorPrice(e instanceof Error ? e.message : "Failed to load"),
				)
				.finally(() => setLoadingPrice(false));
		},
		[decodedName, tierNum],
	);

	const fetchHistory = useCallback(
		(range: DateRange, background = false) => {
			if (!background) {
				setLoadingHistory(true);
				setErrorHistory(null);
			}
			const startDate = getStartDate(range);
			const historyParams =
				startDate || tierNum != null
					? {
							...(startDate && { start_date: startDate }),
							...(tierNum != null && { tier: tierNum }),
						}
					: undefined;
			getTradeHistoricDays(decodedName, historyParams)
				.then((data) => {
					const normalized = data.map((d) => ({
						...d,
						date: d.date ?? d.timestamp ?? "",
					}));
					return normalized.sort(
						(a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime(),
					);
				})
				.then(setHistory)
				.catch((e) =>
					setErrorHistory(e instanceof Error ? e.message : "Failed to load"),
				)
				.finally(() => setLoadingHistory(false));
		},
		[decodedName, tierNum],
	);

	const getListingsCacheKey = useCallback(
		(page: number) =>
			`${decodedName}|${tierNum ?? "all"}|${listingsTab}|${page}|${listingsPageSize}`,
		[decodedName, tierNum, listingsTab, listingsPageSize],
	);

	const fetchListings = useCallback(
		(force = false, background = false) => {
			const cacheKey = getListingsCacheKey(listingsPage);
			const cached = listingsCache.current.get(cacheKey);
			const cacheValid =
				cached && Date.now() - cached.fetchedAt < REFRESH_INTERVAL_MS;

			if (!force && cacheValid) {
				setListings(cached.items);
				setListingsTotal(cached.total);
				return;
			}

			if (!background) {
				setLoadingListings(true);
				setErrorListings(null);
			}
			getTradeListingsForItem(decodedName, {
				page: listingsPage,
				page_size: listingsPageSize,
				...(tierNum != null && { tier: tierNum }),
				unidentified: listingsTab === "unidentified",
			})
				.then((data) => {
					setListings(data.items);
					setListingsTotal(data.total);
					listingsCache.current.set(cacheKey, {
						items: data.items,
						total: data.total,
						fetchedAt: Date.now(),
					});
				})
				.catch((e) => {
					if (!background) {
						setErrorListings(e instanceof Error ? e.message : "Failed to load");
					}
				})
				.finally(() => setLoadingListings(false));
		},
		[
			decodedName,
			tierNum,
			listingsPage,
			listingsPageSize,
			listingsTab,
			getListingsCacheKey,
		],
	);

	useEffect(() => {
		fetchPrice();
	}, [fetchPrice]);

	useEffect(() => {
		setListingsPage(1);
		listingsCache.current.clear();
	}, [listingsTab, listingsPageSize]);

	useEffect(() => {
		fetchListings();
	}, [fetchListings]);

	const refreshInBackground = useCallback(() => {
		fetchPrice(true);
		fetchHistory(dateRange, true);
		fetchListings(true, true);
	}, [fetchPrice, fetchHistory, dateRange, fetchListings]);

	useEffect(() => {
		const id = setInterval(refreshInBackground, REFRESH_INTERVAL_MS);
		return () => clearInterval(id);
	}, [refreshInBackground]);

	const listingsMaxPage = Math.max(
		1,
		Math.ceil(listingsTotal / listingsPageSize),
	);
	const listingsPageNumbers = useMemo(() => {
		const pages: (number | "ellipsis")[] = [];
		const maxPage = listingsMaxPage;
		const page = listingsPage;
		const delta = 2;
		const start = Math.max(2, page - delta);
		const end = Math.min(maxPage - 1, page + delta);
		pages.push(1);
		if (start > 2) pages.push("ellipsis");
		for (let i = start; i <= end; i++) pages.push(i);
		if (end < maxPage - 1) pages.push("ellipsis");
		if (maxPage > 1) pages.push(maxPage);
		return pages;
	}, [listingsPage, listingsMaxPage]);

	useEffect(() => {
		fetchHistory(dateRange);
	}, [dateRange, fetchHistory]);

	const refreshAll = () => {
		fetchPrice();
		fetchHistory(dateRange);
		fetchListings(true);
	};

	const isAnyLoading = loadingPrice || loadingHistory || loadingListings;

	useEffect(() => {
		console.log("[TradeItemDetail] data:", {
			decodedName,
			tierNum,
			itemEntry: itemEntry
				? { internalName: itemEntry.internalName, type: itemEntry.type }
				: null,
			priceInfo: priceInfo
				? {
						average_price: priceInfo.average_price,
						total_count: priceInfo.total_count,
					}
				: null,
			history: history.length,
			listings: listings.length,
			listingsTotal,
			listingsPage,
			listingsPageSize,
			listingsTab,
			dateRange,
		});
	}, [
		decodedName,
		tierNum,
		itemEntry,
		priceInfo,
		history.length,
		listings.length,
		listingsTotal,
		listingsPage,
		listingsPageSize,
		listingsTab,
		dateRange,
	]);

	const rarity =
		(itemEntry?.rarity ?? listings[0]?.rarity ?? "").toLowerCase() || null;
	const itemLevel = itemEntry?.requirements?.level;
	const itemType = itemEntry?.type ?? "";
	const itemSubType = itemEntry?.subType ?? "";

	const subtitle = [
		tierNum != null ? `Tier ${tierRoman(tierNum)}` : null,
		itemLevel != null ? `Lv. ${itemLevel}` : null,
		rarity ? rarity.charAt(0).toUpperCase() + rarity.slice(1) : null,
		itemSubType ? itemSubType.replace(/([A-Z])/g, " $1").trim() : null,
		itemType ? itemType.replace(/([A-Z])/g, " $1").trim() : null,
	]
		.filter(Boolean)
		.join(" ");

	const xAxisTickFormatter =
		dateRange === "7d" ? formatTimeShort : formatDateShort;
	const tooltipLabelFormatter =
		dateRange === "7d" ? formatDateTimeFull : formatDateFull;

	return (
		<div className="space-y-6 px-1 sm:px-0">
			<div className="flex sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/trademarket">
						<ArrowLeft className="size-4" />
						Back
					</Link>
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={refreshAll}
					disabled={isAnyLoading}
				>
					{isAnyLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
				</Button>
			</div>

			<div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 min-w-0">
				<div className="flex size-14 sm:size-16 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/40">
					<ItemIcon
						item={itemEntry ?? decodedName}
						alt={decodedName}
						className="size-12"
					/>
				</div>
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<h2
							className={cn(
								"text-xl font-semibold truncate",
								rarity
									? getRarityStyles(
											rarity.charAt(0).toUpperCase() + rarity.slice(1),
										).text
									: "text-foreground",
							)}
						>
							{decodedName}
						</h2>
					</div>
					{subtitle && (
						<p className="text-sm text-muted-foreground capitalize">
							{subtitle}
						</p>
					)}
				</div>
			</div>

			{/* Price stats */}
			{errorPrice && <ErrorBanner message={errorPrice} />}

			{loadingPrice ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-[88px] rounded-lg" />
					))}
				</div>
			) : priceInfo ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					<StatCard
						label="Avg"
						price={priceInfo.average_price}
						sub={`${priceInfo.total_count} total sales`}
					/>
					<StatCard label="High" price={priceInfo.highest_price} />
					<StatCard label="Low" price={priceInfo.lowest_price} />
					{priceInfo.unidentified_count > 0 && (
						<StatCard
							label="Unidentified Avg"
							price={priceInfo.unidentified_average_price}
							sub={`${priceInfo.unidentified_count} unid sales`}
						/>
					)}
				</div>
			) : null}

			{/* Price history chart */}
			<Card>
				<CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
					<CardTitle className="text-sm font-medium">Price History</CardTitle>
					{/* Series toggles */}
					<div className="flex flex-wrap gap-1.5 min-w-0">
						{ALL_SERIES.map((key) => {
							const cfg = chartConfig[key];
							const active = visibleSeries.has(key);
							return (
								<button
									key={key}
									type="button"
									onClick={() => toggleSeries(key)}
									className={cn(
										"flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono transition-opacity",
										active ? "opacity-100" : "opacity-40",
									)}
									style={{
										borderColor: cfg.color,
										color: active ? cfg.color : undefined,
									}}
								>
									<span
										className="size-2 rounded-full shrink-0"
										style={{ background: cfg.color }}
									/>
									{cfg.label}
								</button>
							);
						})}
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{errorHistory && <ErrorBanner message={errorHistory} />}

					{loadingHistory ? (
						<Skeleton className="h-[280px] sm:h-[320px] min-h-[200px] rounded-lg" />
					) : history.length > 0 ? (
						<ChartContainer
							config={chartConfig}
								className="aspect-auto h-[280px] sm:h-[320px] min-h-[200px] w-full"
						>
							<ComposedChart
								data={history}
								margin={{
									top: 4,
									right: visibleSeries.has("total_count") ? 50 : 4,
									bottom: 0,
									left: 0,
								}}
							>
								<defs>
									<linearGradient id="fillAvg" x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="5%"
											stopColor="var(--color-average_price)"
											stopOpacity={0.25}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-average_price)"
											stopOpacity={0}
										/>
									</linearGradient>
									<linearGradient id="fillMid80" x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="5%"
											stopColor="var(--color-average_mid_80_percent_price)"
											stopOpacity={0.25}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-average_mid_80_percent_price)"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-border/30"
								/>
								<XAxis
									dataKey="date"
									tickFormatter={xAxisTickFormatter}
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									yAxisId="price"
									tickFormatter={formatPrice}
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
									width={55}
								/>
								{visibleSeries.has("total_count") && (
									<YAxis
										yAxisId="volume"
										orientation="right"
										tickFormatter={(v) =>
											v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
										}
										tick={{ fontSize: 11 }}
										tickLine={false}
										axisLine={false}
										width={45}
									/>
								)}
								<ChartTooltip
									content={
										<ChartTooltipContent
											labelFormatter={(v) => tooltipLabelFormatter(String(v))}
											formatter={(value, name) => {
												const cfg = chartConfig[name as SeriesKey];
												return (
													<>
														<span className="text-muted-foreground">
															{cfg?.label ?? String(name)}
														</span>
														{name === "total_count" ? (
															<span>
																{Number(value).toLocaleString()} sales
															</span>
														) : (
															<EmeraldPrice price={Number(value)} />
														)}
													</>
												);
											}}
										/>
									}
								/>
								{visibleSeries.has("total_count") && (
									<Bar
										yAxisId="volume"
										dataKey="total_count"
										fill="var(--color-total_count)"
										fillOpacity={0.3}
										radius={[2, 2, 0, 0]}
									/>
								)}
								{visibleSeries.has("average_price") && (
									<Area
										yAxisId="price"
										type="monotone"
										dataKey="average_price"
										stroke="var(--color-average_price)"
										fill="url(#fillAvg)"
										strokeWidth={2}
										dot={false}
									/>
								)}
								{visibleSeries.has("average_mid_80_percent_price") && (
									<Area
										yAxisId="price"
										type="monotone"
										dataKey="average_mid_80_percent_price"
										stroke="var(--color-average_mid_80_percent_price)"
										fill="url(#fillMid80)"
										strokeWidth={2}
										dot={false}
									/>
								)}
								{visibleSeries.has("highest_price") && (
									<Line
										yAxisId="price"
										type="monotone"
										dataKey="highest_price"
										stroke="var(--color-highest_price)"
										strokeWidth={1.5}
										dot={false}
									/>
								)}
								{visibleSeries.has("lowest_price") && (
									<Line
										yAxisId="price"
										type="monotone"
										dataKey="lowest_price"
										stroke="var(--color-lowest_price)"
										strokeWidth={1.5}
										dot={false}
									/>
								)}
								{visibleSeries.has("unidentified_average_price") && (
									<Line
										yAxisId="price"
										type="monotone"
										dataKey="unidentified_average_price"
										stroke="var(--color-unidentified_average_price)"
										strokeWidth={1.5}
										strokeDasharray="4 3"
										dot={false}
									/>
								)}
							</ComposedChart>
						</ChartContainer>
					) : (
						<p className="py-12 text-center text-sm text-muted-foreground">
							No price history available for this period.
						</p>
					)}

					<div className="flex flex-wrap justify-center gap-1 pt-3 mx-auto">
						{(["7d", "30d", "90d"] as const).map((range) => (
							<button
								key={range}
								type="button"
								onClick={() => setDateRange(range)}
								className={cn(
									"rounded-full border px-3 py-2 text-xs font-medium transition-colors min-h-9",
									dateRange === range
										? "border-primary bg-primary/20 text-primary"
										: "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
								)}
							>
								{range === "7d"
									? "7 days"
									: range === "30d"
										? "30 days"
										: "90 days"}
							</button>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Recent listings */}
			<Card>
				<CardHeader className="pb-2">
					<div className="flex gap-2 sm:flex-row sm:items-center justify-between">
						<div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
							<CardTitle className="text-sm font-medium shrink-0">
								Recent Listings
							</CardTitle>
							<div className="flex rounded-lg border border-border/50 w-fit p-0.5 ">
								<button
									type="button"
									onClick={() => setListingsTab("identified")}
									className={cn(
										"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
										listingsTab === "identified"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									Id
								</button>
								<button
									type="button"
									onClick={() => setListingsTab("unidentified")}
									className={cn(
										"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
										listingsTab === "unidentified"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									Unid
								</button>
							</div>
						</div>
						<div className="flex  flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
							{listingsMaxPage > 1 && !loadingListings && (
								<div className="flex items-center gap-0.5">
									<Button
										variant="outline"
										size="sm"
										className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setListingsPage((p) => Math.max(1, p - 1))}
										disabled={listingsPage <= 1}
									>
										{"<"}
									</Button>
									<span className="text-sm text-muted-foreground tabular-nums px-2 text-center">
										{listingsPage}/{listingsMaxPage}
									</span>
									<Button
										variant="outline"
										size="sm"
										className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
										onClick={() =>
											setListingsPage((p) => Math.min(listingsMaxPage, p + 1))
										}
										disabled={listingsPage >= listingsMaxPage}
									>
										{">"}
									</Button>
								</div>
							)}

							<Button
								variant="outline"
								size="icon"
								className="size-8 shrink-0"
								onClick={() => fetchListings(true)}
								disabled={loadingListings}
								title="Refresh listings"
							>
								{loadingListings ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<RefreshCw className="size-4" />
								)}
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{errorListings && <ErrorBanner message={errorListings} />}

					{loadingListings ? (
						<Table className="[&_tbody_td]:py-3 sm:[&_tbody_td]:py-4">
							<TableHeader>
								<TableRow>
									<TableHead>Item</TableHead>
									<TableHead className="text-center">Roll</TableHead>
									<TableHead className="text-right">Price</TableHead>
									<TableHead className="text-right">Time</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{Array.from({ length: listingsPageSize }).map((_, i) => (
									<TableRow key={i}>
										<TableCell>
											<Skeleton className="h-14 w-full rounded-md" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-14 w-full rounded-md" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-14 w-full rounded-md" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-14 w-full rounded-md" />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : listings.length > 0 ? (
							<Table className="[&_tbody_td]:py-3 sm:[&_tbody_td]:py-4">
							<TableHeader>
								<TableRow>
									<TableHead>Item</TableHead>
										<TableHead className="text-center">Roll</TableHead>
									<TableHead className="text-right">Price</TableHead>
									<TableHead className="text-right">Time</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{listings.map((l) => {
									const rarityFormatted = l.rarity
										? l.rarity.charAt(0).toUpperCase() +
											l.rarity.slice(1).toLowerCase()
										: "";
									const { text } = getRarityStyles(rarityFormatted);
									return (
										<TableRow key={`${l.hash_code}-${l.timestamp}`}>
											<TableCell className="whitespace-normal align-top max-w-[280px]">
												<div className="flex items-start gap-2 font-sans">
													<ItemIcon
														item={l.icon?.value ?? l.name}
														alt={l.name}
														className="size-12 shrink-0"
													/>
													<div className="min-w-0">
														<div
															className={cn(
																"flex items-center gap-1.5 flex-wrap",
																text,
															)}
														>
															{l.amount > 1 && (
																<span className="text-muted-foreground text-xs tabular-nums shrink-0">
																	{l.amount}x
																</span>
															)}
															<span className="text-lg font-medium">
																{l.name}
															</span>
															{l.unidentified && (
																<Badge
																	variant="outline"
																	className="text-[9px] shrink-0"
																>
																	Unid
																</Badge>
															)}
															{l.rarity && (
																<Badge
																	variant="outline"
																	className={cn(
																		"text-[9px] shrink-0",
																		getRarityStyles(rarityFormatted).badge,
																	)}
																>
																	{l.rarity}
																</Badge>
															)}
															{l.type && (
																<span className="text-[10px] text-muted-foreground shrink-0">
																	{l.type}
																</span>
															)}
															{l.tier != null && (
																<Badge
																	variant="secondary"
																	className="text-[9px] shrink-0"
																>
																	{tierRoman(l.tier)}
																</Badge>
															)}
														</div>
														{l.stat_rolls != null &&
															l.stat_rolls.length > 0 && (
																<div className="flex flex-wrap gap-1 mt-1">
																	{[...l.stat_rolls]
																		.sort(
																			(a, b) => (b.stars ?? 0) - (a.stars ?? 0),
																		)
																		.map((s, i) => (
																			<span
																				key={s.apiName ?? i}
																				className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px]"
																			>
																				<span className="text-muted-foreground capitalize">
																					{s.displayName ?? s.apiName ?? "—"}
																				</span>
																				<span className="tabular-nums">
																					{formatStatRollValue(s)}
																				</span>
																				{s.stars != null && s.stars > 0 && (
																					<span
																						className="text-amber-500"
																						title={`${s.stars} star${s.stars !== 1 ? "s" : ""}`}
																					>
																						{"★".repeat(s.stars)}
																					</span>
																				)}
																			</span>
																		))}
																</div>
															)}
													</div>
												</div>
											</TableCell>
											<TableCell className="text-center font-mono tabular-nums">
												{!l.unidentified &&
												l.overall_roll != null &&
												l.overall_roll > 0 ? (
														<span className="text-muted-foreground flex flex-col">
														{l.overall_roll.toFixed(1)}%
														{l.reroll_count != null && l.reroll_count > 0 && (
															<span className="text-xs">
																{" "}
																x{l.reroll_count}
															</span>
														)}
													</span>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
											<TableCell className="text-right font-mono">
												<EmeraldPrice price={l.listing_price} size="lg" />
											</TableCell>
											<TableCell
												className="text-right text-muted-foreground text-sm"
												suppressHydrationWarning
											>
												{formatTimeElapsed(l.timestamp)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					) : (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No active listings found.
						</p>
					)}

					{!loadingListings && listings.length > 0 && (
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center pt-2 w-full gap-3">
							<div className="flex-1 shrink-0 min-w-0 items-center gap-2 font-sans flex">
								<p className="text-sm text-muted-foreground">Limit:</p>
								<Select
									value={String(listingsPageSize)}
									onValueChange={(v) => setListingsPageSize(Number(v))}
								>
									<SelectTrigger size="sm" className="h-9 sm:h-8 w-[80px] min-w-[80px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="10">10</SelectItem>
										<SelectItem value="25">25</SelectItem>
										<SelectItem value="50">50</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex-1 flex flex-wrap items-center justify-center gap-2">
								{listingsMaxPage > 1 && (
									<>
										<Button
											variant="outline"
											size="sm"
											className="h-9 w-9 sm:h-8 sm:w-8 p-0 shrink-0"
											onClick={() => setListingsPage((p) => Math.max(1, p - 1))}
											disabled={listingsPage <= 1}
										>
											‹
										</Button>

										{listingsPageNumbers.map(
											(p: number | "ellipsis", i: number) =>
												p === "ellipsis" ? (
													<span
														key={`e-${i}`}
														className="flex size-8 items-center justify-center text-xs text-muted-foreground shrink-0"
													>
														…
													</span>
												) : (
													<Button
														key={p}
														variant={p === listingsPage ? "secondary" : "ghost"}
														size="sm"
															className="text-xs min-h-9 min-w-9 sm:min-h-8 sm:min-w-8 shrink-0"
														onClick={() => setListingsPage(p)}
													>
														{p}
													</Button>
												),
										)}

										<Button
											variant="outline"
											size="sm"
											className="h-9 w-9 sm:h-8 sm:w-8 p-0 shrink-0"
											onClick={() =>
												setListingsPage((p) => Math.min(listingsMaxPage, p + 1))
											}
											disabled={listingsPage >= listingsMaxPage}
										>
											›
										</Button>
									</>
								)}
							</div>
							<div className="flex-1 shrink-0 min-w-0 hidden sm:block" aria-hidden />
						</div>
					)}
				</CardContent>
			</Card>

			{/* Item details */}
			{itemEntry && (
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Item Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Basic info */}
						<div className="grid gap-2 text-sm sm:grid-cols-2">
							{itemEntry.type && (
								<div>
									<span className="text-muted-foreground">Type</span>
									<p className="capitalize">
										{(itemEntry as { weaponType?: string }).weaponType
											? `${(itemEntry as { weaponType?: string }).weaponType} ${itemEntry.type}`
											: itemEntry.subType
												? `${itemEntry.subType} ${itemEntry.type}`
												: itemEntry.type.replace(/([A-Z])/g, " $1").trim()}
									</p>
								</div>
							)}
							{itemEntry.attackSpeed && (
								<div>
									<span className="text-muted-foreground">Attack Speed</span>
									<p className="capitalize">
										{itemEntry.attackSpeed.replace(/([A-Z])/g, " $1").trim()}
									</p>
								</div>
							)}
							{itemEntry.averageDPS != null && (
								<div>
									<span className="text-muted-foreground">Avg DPS</span>
									<p>{itemEntry.averageDPS.toLocaleString()}</p>
								</div>
							)}
							{itemEntry.powderSlots != null && (
								<div>
									<span className="text-muted-foreground">Powder Slots</span>
									<p>{itemEntry.powderSlots}</p>
								</div>
							)}
							{itemEntry.dropRestriction && (
								<div>
									<span className="text-muted-foreground">Drop</span>
									<p className="capitalize">{itemEntry.dropRestriction}</p>
								</div>
							)}
						</div>

						{/* Requirements */}
						{itemEntry.requirements &&
							Object.keys(itemEntry.requirements).length > 0 && (
								<div>
									<p className="mb-2 text-xs font-medium text-muted-foreground">
										Requirements
									</p>
									<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
										{itemEntry.requirements.level != null && (
											<span>Lv. {itemEntry.requirements.level}</span>
										)}
									{(itemEntry.requirements.classRequirement ??
											(itemEntry.requirements as { classRequirement?: string })
												.classRequirement) && (
											<span className="capitalize">
												{(
												itemEntry.requirements.classRequirement ??
													(
														itemEntry.requirements as {
															classRequirement?: string;
														}
													).classRequirement
												)?.replace(/_/g, " ")}
											</span>
										)}
										{itemEntry.requirements.strength != null && (
											<span>Str {itemEntry.requirements.strength}</span>
										)}
										{itemEntry.requirements.dexterity != null && (
											<span>Dex {itemEntry.requirements.dexterity}</span>
										)}
										{itemEntry.requirements.intelligence != null && (
											<span>Int {itemEntry.requirements.intelligence}</span>
										)}
										{itemEntry.requirements.defence != null && (
											<span>Def {itemEntry.requirements.defence}</span>
										)}
										{itemEntry.requirements.agility != null && (
											<span>Agi {itemEntry.requirements.agility}</span>
										)}
									</div>
								</div>
							)}

						{/* Base stats */}
						{itemEntry.base && Object.keys(itemEntry.base).length > 0 && (
							<div>
								<p className="mb-2 text-xs font-medium text-muted-foreground">
									Base
								</p>
								<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
									{Object.entries(itemEntry.base).map(([key, val]) => {
										if (val == null) return null;
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
													{label}: {v.min}–{v.max}
												</span>
											);
										}
										return null;
									})}
								</div>
							</div>
						)}

						{/* Identifications */}
						{itemEntry.identifications &&
							Object.keys(itemEntry.identifications).length > 0 && (
								<div>
									<p className="mb-2 text-xs font-medium text-muted-foreground">
										Identifications
									</p>
									<div className="grid gap-1.5 text-sm sm:grid-cols-2">
										{Object.entries(itemEntry.identifications).map(
											([key, val]) => {
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
														<span className="text-muted-foreground capitalize">
															{label}
														</span>
														<span className="tabular-nums">
															{isRange
																? `${(id as ItemIdentification).min} ~ ${(id as ItemIdentification).raw} ~ ${(id as ItemIdentification).max}`
																: String(id)}
														</span>
													</div>
												);
											},
										)}
									</div>
								</div>
							)}

						{/* Lore */}
						{itemEntry.lore && (
							<div>
								<p className="mb-2 text-xs font-medium text-muted-foreground">
									Lore
								</p>
								<p className="text-sm italic text-muted-foreground leading-relaxed">
									{itemEntry.lore}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function ErrorBanner({ message }: { message: string }) {
	return (
		<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{message}
		</div>
	);
}
