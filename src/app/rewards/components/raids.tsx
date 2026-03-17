"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegionCard } from "@/components/raidpool/region-card";
import { getItemDatabaseFull } from "@/api/item";
import { getRaidRewardsGrouped } from "@/api/wynnventory/raidpool";
import type { ItemDatabase } from "@/types/item";
import type { CompletedData } from "@/components/raidpool/region-card";
import type { RaidGroupedRegion } from "@/types/wynnventory/raidpool";
import { Separator } from "@/components/ui/separator";
import { ItemInfo } from "@/components/item-info";

const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STALE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // check every hour

const RAID_REGION_SHORT: Record<string, string> = {
	"the nameless anomaly": "TNA",
	"nameless anomaly": "TNA",
	"orphion's nexus of light": "NOL",
	"nexus of light": "NOL",
	"the canyon colossus": "TCC",
	"canyon colossus": "TCC",
	"nest of the grootslangs": "NOTG",
	"grootslangs": "NOTG",
};

function getRegionShortName(region: string): string {
	const key = region.toLowerCase().trim();
	return RAID_REGION_SHORT[key] ?? region.toUpperCase().slice(0, 4);
}

export function RaidsContent({
	refreshRef,
	onLoadingChange,
}: {
	refreshRef?: React.MutableRefObject<(() => void) | null>;
	onLoadingChange?: (loading: boolean) => void;
} = {}) {
	const [itemDb, setItemDb] = useState<ItemDatabase>({});
	const [grouped, setGrouped] = useState<RaidGroupedRegion[] | null>(null);
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
		getRaidRewardsGrouped()
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
				<RaidsLoadingSkeleton />
			) : grouped && grouped.length > 0 ? (
				<Tabs
					value={selectedRegion ?? grouped[0].region}
					onValueChange={setSelectedRegion}
					className="space-y-4"
				>
					<div className="relative flex flex-col items-center justify-center gap-2">
					<p className="text-2xl capitalize text-white font-pixel-circle">
							{selectedRegion ?? grouped[0].region}
						</p>
						<Image
							src={`https://cdn.wynncraft.com/nextgen/raids/${encodeURIComponent(selectedRegion ?? grouped[0].region)}.webp`}
							alt={selectedRegion ?? grouped[0].region}
							width={288}
							height={288}
							className="size-72 rounded-lg object-cover"
						/>
						<Separator className="my-6 max-w-4xl mx-auto" />
						
						<TabsList variant="line" className="flex-wrap">
							{grouped.map((r) => (
								<TabsTrigger
									className="text-lg font-mono"
									key={r.region}
									value={r.region}
									title={r.region}
								>
									{getRegionShortName(r.region)}
								</TabsTrigger>
							))}
						</TabsList>
						
					</div>

					{grouped.map((r) => (
						<TabsContent key={r.region} value={r.region}>
							<RegionCard
								region={r.region}
								timestamp={r.timestamp}
								groups={r.group_items}
								itemDb={itemDb}
								onItemClick={openItemInfo}
							/>
						</TabsContent>
					))}
				</Tabs>
			) : grouped && grouped.length === 0 ? (
				<p className="py-8 text-center text-sm text-muted-foreground">
					No regions found.
				</p>
			) : null}
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

function RaidsLoadingSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex flex-col items-center justify-center gap-2">
				<Skeleton className="h-8 w-48 rounded" />
				<Skeleton className="size-56 rounded-lg" />
			</div>
			<div className="my-6 max-w-4xl mx-auto">
				<Skeleton className="h-px w-full" />
			</div>
			<div className="w-full">
				<div className="flex gap-2 justify-center ">
					{["NOTG", "NOL", "TCC", "TNA"].map((label) => (
						<Skeleton key={label} className="h-9 w-16 rounded-md" />
					))}
				</div>
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
	);
}
