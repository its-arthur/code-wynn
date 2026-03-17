"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Info, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RegionCard } from "@/components/raidpool/region-card";
import { getItemDatabaseFull } from "@/api/item";
import { ItemIcon } from "@/lib/item-icons";
import { getRarityStyles } from "@/lib/rarity-color";
import { getLootrunRewardsGrouped } from "@/api/wynnventory/lootpool";
import { resolveWynnData } from "@/lib/resolve-wynn-item";
import { cn } from "@/lib/utils";
import type { ItemDatabase } from "@/types/item";
import type { LootrunGroupedRegion } from "@/types/wynnventory/lootpool";
import type { CompletedData } from "@/components/raidpool/region-card";
import type { GroupedLootItem } from "@/types/wynnventory/common";
import { Separator } from "@/components/ui/separator";
import { ItemInfo } from "@/components/item-info";

const AUTO_SCROLL_DELAY_MS = 4000;
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STALE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // check every hour

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

export function LootrunsContent({
	refreshRef,
	onLoadingChange,
}: {
	refreshRef?: React.MutableRefObject<(() => void) | null>;
	onLoadingChange?: (loading: boolean) => void;
} = {}) {
	const [itemDb, setItemDb] = useState<ItemDatabase>({});
	const [grouped, setGrouped] = useState<LootrunGroupedRegion[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
	const [itemInfoOpen, setItemInfoOpen] = useState(false);
	const [itemInfoCompletedData, setItemInfoCompletedData] =
		useState<CompletedData | null>(null);

	useEffect(() => {
		getItemDatabaseFull().then(setItemDb).catch(() => {});
	}, []);

	const fetchGrouped = useCallback(() => {
		setLoading(true);
		setError(null);
		getLootrunRewardsGrouped()
			.then(setGrouped)
			.catch((e) =>
				setError(e instanceof Error ? e.message : "Failed to load"),
			)
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		if (refreshRef) refreshRef.current = fetchGrouped;
		return () => {
			if (refreshRef) refreshRef.current = null;
		};
	}, [refreshRef, fetchGrouped]);

	useEffect(() => {
		onLoadingChange?.(loading);
	}, [loading, onLoadingChange]);

	useEffect(() => {
		fetchGrouped();
	}, [fetchGrouped]);

	useEffect(() => {
		if (!grouped || grouped.length === 0) return;
		const ts = grouped[0]?.timestamp;
		if (!ts) return;
		const dataTime = new Date(ts).getTime();
		if (Number.isNaN(dataTime)) return;

		const checkStale = () => {
			if (Date.now() - dataTime >= STALE_AFTER_MS) fetchGrouped();
		};
		checkStale(); // check immediately
		const id = setInterval(checkStale, STALE_CHECK_INTERVAL_MS);
		return () => clearInterval(id);
	}, [grouped, fetchGrouped]);

	const openItemInfo = useCallback((completedData: CompletedData) => {
		setItemInfoCompletedData(completedData);
		setItemInfoOpen(true);
	}, []);

	return (
		<div className="space-y-4">
			
			<ItemInfo
				open={itemInfoOpen}
				onOpenChange={setItemInfoOpen}
				completedData={itemInfoCompletedData}
			/>
			{error && <ErrorBanner message={error} />}

			{loading ? (
				<LootrunsLoadingSkeleton />
			) : grouped && grouped.length > 0 ? (
				<>
					<ShinyCarousel
						grouped={grouped}
						itemDb={itemDb}
						selectedRegion={selectedRegion ?? grouped[0].region}
						onRegionSelect={setSelectedRegion}
							onItemInfoClick={openItemInfo}
					/>
					<Separator className="my-6 max-w-4xl mx-auto" />
					<Tabs
						value={selectedRegion ?? grouped[0].region}
						onValueChange={setSelectedRegion}
						className="space-y-4"
					>
						<div className="relative flex items-center justify-start sm:justify-center gap-2 w-full overflow-x-auto sm:overflow-visible">
							<TabsList variant="line" className="flex-nowrap sm:flex-wrap w-max min-w-full sm:min-w-0 sm:w-full justify-start sm:justify-center shrink-0">
								{grouped.map((r) => (
									<TabsTrigger
										className="text-base sm:text-lg font-mono capitalize min-h-9 shrink-0"
										key={r.region}
										value={r.region}
									>
										{r.region}
									</TabsTrigger>
								))}
							</TabsList>
						</div>

						{grouped.map((r) => (
							<TabsContent key={r.region} value={r.region}>
								<RegionCard
									region={r.region}
									timestamp={r.timestamp}
									groups={r.region_items}
									itemDb={itemDb}
									onItemClick={openItemInfo}
								/>
							</TabsContent>
						))}
					</Tabs>
				</>
			) : grouped && grouped.length === 0 ? (
				<p className="py-8 text-center text-sm text-muted-foreground">
					No regions found.
				</p>
			) : null}
		</div>
	);
}

function ShinyCarousel({
	grouped,
	itemDb,
	selectedRegion,
	onRegionSelect,
	onItemInfoClick,
}: {
	grouped: LootrunGroupedRegion[];
	itemDb: ItemDatabase;
	selectedRegion: string;
	onRegionSelect: (region: string) => void;
		onItemInfoClick?: (completedData: CompletedData) => void;
}) {
	const [api, setApi] = useState<CarouselApi | null>(null);
	const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const shinyWithRegion = grouped.flatMap((r) =>
		r.region_items.flatMap((g) =>
			g.loot_items
				.filter((item) => item.shiny)
				.map((item) => ({ item, regionLabel: r.region })),
		),
	);

	useEffect(() => {
		if (!api || shinyWithRegion.length <= 1) return;
		autoplayRef.current = setInterval(() => {
			api.scrollNext();
		}, AUTO_SCROLL_DELAY_MS);
		return () => {
			if (autoplayRef.current) clearInterval(autoplayRef.current);
		};
	}, [api, shinyWithRegion.length]);

	useEffect(() => {
		if (!api || shinyWithRegion.length === 0) return;
		const idx = shinyWithRegion.findIndex(
			(x) => x.regionLabel === selectedRegion,
		);
		if (idx >= 0) api.scrollTo(idx);
	}, [api, selectedRegion]);

	if (shinyWithRegion.length === 0) return null;

	const toCompletedData = (item: GroupedLootItem): CompletedData => {
		const wynnInv = {
			item_type: item.itemType,
			type: item.type,
			rarity: item.rarity,
		};
		const normalized = {
			amount: item.amount,
			icon: item.icon,
			itemType: item.itemType,
			name: item.name,
			rarity: item.rarity,
			shiny: item.shiny,
			shinyStat: null as string | null,
			subtype: item.type ?? "",
		};
		return {
			wynn: resolveWynnData(itemDb, item.name, null, wynnInv),
			wynnInv: normalized,
		};
	};

	return (
		<section className="space-y-4">
			<h3 className="text-center font-medium text-white capitalize font-pixel-circle text-base sm:text-lg">
				Current active shiny
			</h3>
			<Carousel
				opts={{ align: "start", loop: true }}
				setApi={setApi}
				className="w-full min-w-0"
			>
				<CarouselContent className="-ml-4">
					{shinyWithRegion.map(({ item, regionLabel }, i) => (
						<CarouselItem
							key={`${regionLabel}-${item.name}-${i}`}
							className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4 min-w-0"
						>
							<ShinyItemCard
								item={item}
								regionLabel={regionLabel}
								toCompletedData={toCompletedData}
								isActive={regionLabel === selectedRegion}
								onClick={() => onRegionSelect(regionLabel)}
								onItemInfoClick={onItemInfoClick}
							/>
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
		</section>
	);
}

function ShinyItemCard({
	item,
	regionLabel,
	toCompletedData,
	isActive,
	onClick,
	onItemInfoClick,
}: {
	item: GroupedLootItem;
	regionLabel: string;
	toCompletedData: (item: GroupedLootItem) => CompletedData;
	isActive: boolean;
	onClick: () => void;
		onItemInfoClick?: (completedData: CompletedData) => void;
}) {
	const completedData = toCompletedData(item);
	const iconItem = completedData.wynn ?? item.icon?.value ?? item.name;
	const rarity = item.rarity.toLowerCase();
	const rarityFormatted =
		item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1).toLowerCase();
	const { border } = getRarityStyles(rarityFormatted);
	const nameColor = RARITY_COLORS[rarity] ?? "text-foreground";
	const badgeClass = RARITY_BADGE[rarity] ?? RARITY_BADGE.common;

	return (
		<Card
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) =>
				(e.key === "Enter" || e.key === " ") &&
				(e.preventDefault(), onClick())
			}
			className={cn(
				"overflow-hidden transition-colors cursor-pointer hover:bg-muted/50 min-w-0",
				isActive &&
					"border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 hover:bg-emerald-500/10",
			)}
		>
			<CardContent className="flex flex-col items-center gap-3 p-4 relative">
				<span
					className={cn(
						"flex shrink-0 overflow-hidden rounded-lg border-2 relative",
						border.split(" ")[0],
					)}
				>
					<ItemIcon
						item={iconItem}
						alt={item.name}
						className="size-16 sm:size-32 p-4"
					/>
					{onItemInfoClick && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onItemInfoClick(completedData);
						}}
							className="absolute bottom-2 right-2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						aria-label="View item info"
					>
						<Info className="size-4" />
						</button>
					)}
				</span>
				<Badge
					variant="outline"
					className={cn("text-[10px] capitalize", badgeClass)}
				>
					{rarity}
				</Badge>
				<div className="flex flex-col items-center gap-1 text-center min-w-0 w-full">
					<span
						className={cn(
							"text-base sm:text-lg font-medium flex items-center gap-2 truncate max-w-full",
							nameColor,
						)}
					>
						{item.shiny && (
							<Sparkles className="size-4 text-yellow-400" />
						)}
						{item.name}
					</span>
					{item.amount > 1 && (
						<span className="text-xs text-muted-foreground tabular-nums">
							{item.amount}x
						</span>
					)}
				</div>
				<div className="flex flex-col items-center justify-center">
					<p className="text-xs text-muted-foreground">
						Available in:
					</p>
					<span className="text-md text-white capitalize font-mono">
						{regionLabel}
					</span>
				</div>
				{isActive && (
					<div className="h-1 w-4 rounded-full bg-emerald-500/30 absolute bottom-0" />
				)}
			</CardContent>
		</Card>
	);
}

function ErrorBanner({ message }: { message: string }) {
	return (
		<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{message}
		</div>
	);
}

function LootrunsLoadingSkeleton() {
	return (
		<div className="space-y-4">
			<section className="space-y-8">
				<Skeleton className="h-8 w-56 mx-auto rounded" />
				<div className="flex gap-4 -ml-4 overflow-hidden">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4 shrink-0 min-w-0">
							<Skeleton className="h-48 rounded-lg" />
						</div>
					))}
				</div>
			</section>
			<div className="my-6 max-w-4xl mx-auto">
				<Skeleton className="h-px w-full" />
			</div>
			<div className="space-y-4">
				<div className="flex justify-center gap-2 flex-wrap">
					{["Canyon Of Lost", "Corkus", "Molten Heights", "Silent Expanse", "Sky Island"].map((label) => (
						<Skeleton key={label} className="h-9 w-20 rounded-md" />
					))}
				</div>
				<div className="rounded-lg border border-border/50 bg-card max-w-4xl mx-auto overflow-hidden">
					<div className="px-4 py-3 space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-3 w-32" />
					</div>
					<div className="border-t border-border/30 px-4 pb-4 pt-3 space-y-3">
						<div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton key={i} className="h-14 rounded-md" />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
