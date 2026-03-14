"use client";

import { useCallback, useEffect, useState } from "react";
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
	AreaChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Line,
	LineChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import type {
	TradePriceInfo,
	TradeHistoricDay,
	TradeListing,
} from "@/types/wynnventory/trademarket";
import type { ItemEntry } from "@/types/item";
import { cn } from "@/lib/utils";
import { wynnItemGuideUrl } from "@/lib/wynn-cdn";
import { EmeraldPrice } from "@/components/emerald-price";

const RARITY_COLORS: Record<string, string> = {
	common: "text-gray-400",
	unique: "text-yellow-300",
	rare: "text-pink-400",
	legendary: "text-cyan-300",
	fabled: "text-red-400",
	mythic: "text-purple-400",
};

const RARITY_BADGE: Record<string, string> = {
	common: "bg-gray-700/60 text-gray-300 border-gray-600",
	unique: "bg-yellow-900/40 text-yellow-300 border-yellow-700/60",
	rare: "bg-pink-900/40 text-pink-300 border-pink-700/60",
	legendary: "bg-cyan-900/40 text-cyan-200 border-cyan-700/60",
	fabled: "bg-red-900/40 text-red-300 border-red-700/60",
	mythic: "bg-purple-900/40 text-purple-300 border-purple-700/60",
};

const chartConfig = {
	average_price: {
		label: "Avg Price",
		color: "hsl(142, 71%, 45%)",
	},
	average_mid_80_percent_price: {
		label: "Mid 80% Avg",
		color: "hsl(217, 91%, 60%)",
	},
	highest_price: {
		label: "Highest",
		color: "hsl(0, 84%, 60%)",
	},
	lowest_price: {
		label: "Lowest",
		color: "hsl(45, 93%, 47%)",
	},
} satisfies ChartConfig;

type DateRange = "7d" | "30d" | "90d" | "all";

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

function getStartDate(range: DateRange): string | undefined {
	if (range === "all") return undefined;
	const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d.toISOString().slice(0, 10);
}

function StatCard({
	label,
	price,
	sub,
	trend,
}: {
	label: string;
	price: number;
	sub?: string;
	trend?: "up" | "down" | null;
}) {
	return (
		<Card>
			<CardContent className="p-4">
				<p className="text-xs text-muted-foreground">{label}</p>
				<div className="mt-1 flex items-center gap-1.5">
					<EmeraldPrice price={price} size="md" />
					{trend === "up" && <TrendingUp className="size-4 text-emerald-400" />}
					{trend === "down" && <TrendingDown className="size-4 text-red-400" />}
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
}: {
	params: Promise<{ itemName: string }>;
}) {
	const { itemName } = use(params);
	const decodedName = decodeURIComponent(itemName);

	const [itemEntry, setItemEntry] = useState<ItemEntry | null>(null);
	const [imgError, setImgError] = useState(false);
	const [priceInfo, setPriceInfo] = useState<TradePriceInfo | null>(null);
	const [history, setHistory] = useState<TradeHistoricDay[]>([]);
	const [listings, setListings] = useState<TradeListing[]>([]);
	const [dateRange, setDateRange] = useState<DateRange>("30d");

	const [loadingPrice, setLoadingPrice] = useState(true);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [loadingListings, setLoadingListings] = useState(true);
	const [errorPrice, setErrorPrice] = useState<string | null>(null);
	const [errorHistory, setErrorHistory] = useState<string | null>(null);
	const [errorListings, setErrorListings] = useState<string | null>(null);

	useEffect(() => {
		quickSearchItems(decodedName)
			.then((db) => {
				const entry = db[decodedName] ?? Object.values(db)[0];
				if (entry) setItemEntry(entry);
			})
			.catch(() => {});
	}, [decodedName]);

	const fetchPrice = useCallback(() => {
		setLoadingPrice(true);
		setErrorPrice(null);
		getTradePriceInfo(decodedName)
			.then(setPriceInfo)
			.catch((e) =>
				setErrorPrice(e instanceof Error ? e.message : "Failed to load"),
			)
			.finally(() => setLoadingPrice(false));
	}, [decodedName]);

	const fetchHistory = useCallback(
		(range: DateRange) => {
			setLoadingHistory(true);
			setErrorHistory(null);
			const startDate = getStartDate(range);
			getTradeHistoricDays(
				decodedName,
				startDate ? { start_date: startDate } : undefined,
			)
			.then((data) =>
				setHistory(
					data.sort(
						(a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime(),
					),
				),
			)
				.catch((e) =>
					setErrorHistory(e instanceof Error ? e.message : "Failed to load"),
				)
				.finally(() => setLoadingHistory(false));
		},
		[decodedName],
	);

	const fetchListings = useCallback(() => {
		setLoadingListings(true);
		setErrorListings(null);
		getTradeListingsForItem(decodedName, { page: 1, page_size: 10 })
			.then((data) => setListings(data.items))
			.catch((e) =>
				setErrorListings(e instanceof Error ? e.message : "Failed to load"),
			)
			.finally(() => setLoadingListings(false));
	}, [decodedName]);

	useEffect(() => {
		fetchPrice();
		fetchListings();
	}, [fetchPrice, fetchListings]);

	useEffect(() => {
		fetchHistory(dateRange);
	}, [dateRange, fetchHistory]);

	const refreshAll = () => {
		fetchPrice();
		fetchHistory(dateRange);
		fetchListings();
	};

	const isAnyLoading = loadingPrice || loadingHistory || loadingListings;

	const rarity =
		(itemEntry?.rarity ?? listings[0]?.rarity ?? "").toLowerCase() || null;
	const itemLevel = itemEntry?.requirements?.level;
	const itemType = itemEntry?.type ?? "";
	const itemSubType = itemEntry?.subType ?? "";

	const iconName = (() => {
		if (!itemEntry?.icon?.value) return null;
		if (typeof itemEntry.icon.value === "string") return itemEntry.icon.value;
		return itemEntry.icon.value.name ?? null;
	})();

	const subtitle = [
		itemLevel != null ? `Lv. ${itemLevel}` : null,
		rarity ? rarity.charAt(0).toUpperCase() + rarity.slice(1) : null,
		itemSubType
			? itemSubType.replace(/([A-Z])/g, " $1").trim()
			: null,
		itemType ? itemType.replace(/([A-Z])/g, " $1").trim() : null,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
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
					Refresh
				</Button>
			</div>

			<div className="flex items-center gap-4">
				{iconName && !imgError ? (
					<div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/40">
						<img
							src={wynnItemGuideUrl(iconName)}
							alt={decodedName}
							className="size-12 object-contain"
							onError={() => setImgError(true)}
						/>
					</div>
				) : (
					<div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/40 text-lg text-muted-foreground">
						?
					</div>
				)}
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<h2
							className={cn(
								"text-xl font-semibold truncate",
								rarity ? RARITY_COLORS[rarity] : "text-foreground",
							)}
						>
							{decodedName}
						</h2>
						{rarity && (
							<Badge
								variant="outline"
								className={cn(
									"shrink-0 text-[10px] capitalize",
									RARITY_BADGE[rarity] ?? "",
								)}
							>
								{rarity}
							</Badge>
						)}
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
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-[88px] rounded-lg" />
					))}
				</div>
			) : priceInfo ? (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<StatCard
						label="Average Price"
						price={priceInfo.average_price}
						sub={`${priceInfo.total_count} total sales`}
					/>
					<StatCard
						label="Mid 80% Average"
						price={priceInfo.average_mid_80_percent_price}
						sub="Excludes outliers"
					/>
					<StatCard
						label="Highest"
						price={priceInfo.highest_price}
						trend="up"
					/>
					<StatCard
						label="Lowest"
						price={priceInfo.lowest_price}
						trend="down"
					/>
				</div>
			) : null}

			{priceInfo && priceInfo.unidentified_count > 0 && (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					<StatCard
						label="Unidentified Avg"
						price={priceInfo.unidentified_average_price}
						sub={`${priceInfo.unidentified_count} unid sales`}
					/>
					<StatCard
						label="Unid Mid 80% Avg"
						price={priceInfo.unidentified_average_mid_80_percent_price}
					/>
				</div>
			)}

			{/* Price history chart */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Price History</CardTitle>
					<Select
						value={dateRange}
						onValueChange={(v) => setDateRange(v as DateRange)}
					>
						<SelectTrigger className="w-[100px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">7 days</SelectItem>
							<SelectItem value="30d">30 days</SelectItem>
							<SelectItem value="90d">90 days</SelectItem>
							<SelectItem value="all">All time</SelectItem>
						</SelectContent>
					</Select>
				</CardHeader>
				<CardContent>
					{errorHistory && <ErrorBanner message={errorHistory} />}

					{loadingHistory ? (
						<Skeleton className="h-[300px] rounded-lg" />
					) : history.length > 0 ? (
						<ChartContainer
							config={chartConfig}
							className="aspect-auto h-[300px] w-full"
						>
							<AreaChart
								data={history}
								margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
							>
								<defs>
									<linearGradient id="fillAvg" x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="5%"
											stopColor="var(--color-average_price)"
											stopOpacity={0.3}
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
											stopOpacity={0.3}
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
									tickFormatter={formatDateShort}
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									tickFormatter={formatPrice}
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
									width={55}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											labelFormatter={(v) => formatDateFull(String(v))}
										/>
									}
								/>
								<Area
									type="monotone"
									dataKey="average_price"
									stroke="var(--color-average_price)"
									fill="url(#fillAvg)"
									strokeWidth={2}
								/>
								<Area
									type="monotone"
									dataKey="average_mid_80_percent_price"
									stroke="var(--color-average_mid_80_percent_price)"
									fill="url(#fillMid80)"
									strokeWidth={2}
								/>
							</AreaChart>
						</ChartContainer>
					) : (
						<p className="py-12 text-center text-sm text-muted-foreground">
							No price history available for this period.
						</p>
					)}

					{!loadingHistory && history.length > 1 && (
						<div className="mt-4">
							<p className="mb-2 text-xs font-medium text-muted-foreground">
								Price Range (High / Low)
							</p>
							<ChartContainer
								config={chartConfig}
								className="aspect-auto h-[180px] w-full"
							>
								<LineChart
									data={history}
									margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-border/30"
									/>
									<XAxis
										dataKey="date"
										tickFormatter={formatDateShort}
										tick={{ fontSize: 11 }}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										tickFormatter={formatPrice}
										tick={{ fontSize: 11 }}
										tickLine={false}
										axisLine={false}
										width={55}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent
												labelFormatter={(v) => formatDateFull(String(v))}
											/>
										}
									/>
									<Line
										type="monotone"
										dataKey="highest_price"
										stroke="var(--color-highest_price)"
										strokeWidth={1.5}
										dot={false}
									/>
									<Line
										type="monotone"
										dataKey="lowest_price"
										stroke="var(--color-lowest_price)"
										strokeWidth={1.5}
										dot={false}
									/>
								</LineChart>
							</ChartContainer>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Recent listings */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">Recent Listings</CardTitle>
				</CardHeader>
				<CardContent>
					{errorListings && <ErrorBanner message={errorListings} />}

					{loadingListings ? (
						<div className="space-y-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-12 rounded-md" />
							))}
						</div>
					) : listings.length > 0 ? (
						<div className="divide-y divide-border/30">
							{listings.map((l) => (
								<div
									key={`${l.hash_code}-${l.timestamp}`}
									className="flex items-center justify-between gap-3 py-2.5"
								>
									<div className="flex items-center gap-2 min-w-0">
										<span className="text-sm truncate">
											{l.amount > 1 && (
												<span className="text-muted-foreground mr-1 tabular-nums">
													{l.amount}x
												</span>
											)}
											{l.name}
										</span>
										{l.unidentified && (
											<Badge variant="outline" className="text-[9px] shrink-0">
												Unid
											</Badge>
										)}
									</div>
									<div className="flex items-center gap-3 shrink-0">
										<EmeraldPrice price={l.listing_price} />
										<span className="text-[10px] text-muted-foreground">
											{l.timestamp}
										</span>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No active listings found.
						</p>
					)}
				</CardContent>
			</Card>
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
