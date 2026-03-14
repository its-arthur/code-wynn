"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegionCard } from "@/components/raidpool/region-card";
import {
	getLootrunRewardsCurrent,
	getLootrunRewardsGrouped,
	getLootrunRewardsHistory,
} from "@/api/wynnventory/lootpool";
import type {
	LootrunRewardsResponse,
	LootrunGroupedRegion,
	LootrunHistoryResponse,
} from "@/types/wynnventory/lootpool";

function WeekLabel({ week, year }: { week: number; year: number }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
			<Calendar className="size-3" />
			Week {week}, {year}
		</span>
	);
}

export default function LootpoolPage() {
	const [tab, setTab] = useState("current");

	const [current, setCurrent] = useState<LootrunRewardsResponse | null>(null);
	const [grouped, setGrouped] = useState<LootrunGroupedRegion[] | null>(null);
	const [history, setHistory] = useState<LootrunHistoryResponse | null>(null);

	const [historyPage, setHistoryPage] = useState(1);
	const [loading, setLoading] = useState<Record<string, boolean>>({});
	const [errors, setErrors] = useState<Record<string, string | null>>({});

	const setTabLoading = (key: string, val: boolean) =>
		setLoading((p) => ({ ...p, [key]: val }));
	const setTabError = (key: string, val: string | null) =>
		setErrors((p) => ({ ...p, [key]: val }));

	const fetchCurrent = useCallback(() => {
		setTabLoading("current", true);
		setTabError("current", null);
		getLootrunRewardsCurrent()
			.then(setCurrent)
			.catch((e) =>
				setTabError("current", e instanceof Error ? e.message : "Failed to load"),
			)
			.finally(() => setTabLoading("current", false));
	}, []);

	const fetchGrouped = useCallback(() => {
		setTabLoading("grouped", true);
		setTabError("grouped", null);
		getLootrunRewardsGrouped()
			.then(setGrouped)
			.catch((e) =>
				setTabError("grouped", e instanceof Error ? e.message : "Failed to load"),
			)
			.finally(() => setTabLoading("grouped", false));
	}, []);

	const fetchHistory = useCallback((page: number) => {
		setTabLoading("history", true);
		setTabError("history", null);
		getLootrunRewardsHistory(page, 5)
			.then((data) => {
				setHistory(data);
				setHistoryPage(data.page);
			})
			.catch((e) =>
				setTabError("history", e instanceof Error ? e.message : "Failed to load"),
			)
			.finally(() => setTabLoading("history", false));
	}, []);

	useEffect(() => {
		fetchCurrent();
	}, [fetchCurrent]);

	useEffect(() => {
		if (tab === "grouped" && !grouped && !loading.grouped) fetchGrouped();
		if (tab === "history" && !history && !loading.history) fetchHistory(1);
	}, [tab, grouped, history, loading.grouped, loading.history, fetchGrouped, fetchHistory]);

	const refreshTab = () => {
		if (tab === "current") fetchCurrent();
		else if (tab === "grouped") fetchGrouped();
		else if (tab === "history") fetchHistory(historyPage);
	};

	const isLoading = loading[tab];
	const historyMaxPage = history
		? Math.ceil(history.count / history.page_size)
		: 1;

	return (
		<Tabs value={tab} onValueChange={setTab} className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<TabsList>
					<TabsTrigger value="current">Current Week</TabsTrigger>
					<TabsTrigger value="grouped">Grouped</TabsTrigger>
					<TabsTrigger value="history">History</TabsTrigger>
				</TabsList>

				<Button
					variant="outline"
					size="sm"
					onClick={refreshTab}
					disabled={!!isLoading}
				>
					{isLoading ? (
						<Loader2 className="animate-spin" />
					) : (
						<RefreshCw />
					)}
					Refresh
				</Button>
			</div>

			{/* Current Week */}
			<TabsContent value="current" className="space-y-4">
				{errors.current && <ErrorBanner message={errors.current} />}

				{loading.current ? (
					<LoadingSkeleton count={4} />
				) : current ? (
					<>
						<WeekLabel week={current.week} year={current.year} />
						<div className="space-y-3">
							{current.regions.map((r) => (
								<RegionCard
									key={r.region}
									region={r.region}
									timestamp={r.timestamp}
									items={r.items}
								/>
							))}
						</div>
					</>
				) : null}
			</TabsContent>

			{/* Grouped */}
			<TabsContent value="grouped" className="space-y-4">
				{errors.grouped && <ErrorBanner message={errors.grouped} />}

				{loading.grouped ? (
					<LoadingSkeleton count={4} />
				) : grouped ? (
					<div className="space-y-3">
						{grouped.map((r) => (
							<RegionCard
								key={r.region}
								region={r.region}
								timestamp={r.timestamp}
								groups={r.region_items}
							/>
						))}
					</div>
				) : null}
			</TabsContent>

			{/* History */}
			<TabsContent value="history" className="space-y-4">
				{errors.history && <ErrorBanner message={errors.history} />}

				{loading.history ? (
					<LoadingSkeleton count={3} height="h-40" />
				) : history ? (
					<>
						<p className="text-xs text-muted-foreground">
							{history.count} recorded weeks — page {history.page} of{" "}
							{historyMaxPage}
						</p>

						<div className="space-y-6">
							{history.pools.map((pool) => (
								<div key={`${pool.year}-${pool.week}`} className="space-y-3">
									<div className="flex items-center gap-2 border-b border-border/30 pb-2">
										<h3 className="text-sm font-semibold">
											Week {pool.week}, {pool.year}
										</h3>
									</div>
									{pool.regions.map((r) => (
										<RegionCard
											key={r.region}
											region={r.region}
											timestamp={r.timestamp}
											items={r.items}
										/>
									))}
								</div>
							))}
						</div>

						{historyMaxPage > 1 && (
							<div className="flex items-center justify-center gap-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => fetchHistory(historyPage - 1)}
									disabled={historyPage <= 1}
								>
									<ChevronLeft className="size-4" />
									Previous
								</Button>
								<span className="text-xs tabular-nums text-muted-foreground">
									{historyPage} / {historyMaxPage}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => fetchHistory(historyPage + 1)}
									disabled={historyPage >= historyMaxPage}
								>
									Next
									<ChevronRight className="size-4" />
								</Button>
							</div>
						)}
					</>
				) : null}
			</TabsContent>
		</Tabs>
	);
}

function ErrorBanner({ message }: { message: string }) {
	return (
		<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{message}
		</div>
	);
}

function LoadingSkeleton({
	count,
	height = "h-32",
}: {
	count: number;
	height?: string;
}) {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }).map((_, i) => (
				<Skeleton key={i} className={`${height} rounded-lg`} />
			))}
		</div>
	);
}
