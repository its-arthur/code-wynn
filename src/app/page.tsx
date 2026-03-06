"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerMainStats } from "@/api/player";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OnlinePlayersDialog } from "@/components/online-players-dialog";
import { PlayerSkin } from "@/components/player-skin";
import { rankBadgeUrl } from "@/lib/utils";
import { FEATURED_USERNAMES } from "@/data/featured-users";
import type { PlayerMainStats, PlayerMainStatsResponse } from "@/types/player";
import { ArticlesSection } from "@/components/articles-section";

function isMainStats(data: PlayerMainStatsResponse): data is PlayerMainStats {
	return (
		data != null &&
		typeof data === "object" &&
		"username" in data &&
		typeof (data as PlayerMainStats).username === "string"
	);
}

function FeaturedPlayerSection({
	username,
	mainStats,
	loading,
	error,
	onCardClick,
	onOnlineBadgeClick,
}: {
	username: string;
	mainStats: PlayerMainStats | null;
	loading: boolean;
	error: string | null;
	onCardClick: (username: string) => void;
	onOnlineBadgeClick?: (server: string) => void;
}) {
	return (
		<div className="hover:cursor-pointer relative group w-full mx-auto">
			<div
				className="absolute top-0 right-0 z-10 w-full h-full "
				onClick={() => onCardClick(username)}
			/>
			<Card
				className=" transition-colors w-full group-hover:bg-muted/50 group-hover:border-green-500/60"
				role="button"
				tabIndex={0}
			>
				<CardContent className="pt-6">
					<div className="space-y-4">
						<p className="flex items-center justify-center gap-2">
							<span
								className="font-minecraft inline-block px-1.5 py-0.5 text-2xl text-[#ffff55]"
								style={{
									textShadow:
										"1px 1px 0 #3f3f3f, -1px -1px 0 #3f3f3f, 1px -1px 0 #3f3f3f, -1px 1px 0 #3f3f3f",
								}}
							>
								{username}
							</span>
						</p>

						<div className="flex flex-col gap-4">
							<div className="flex justify-center overflow-hidden">
								<PlayerSkin username={username} />
							</div>

							{!loading && !error && mainStats && (
								<div className="flex justify-end gap-3">
									<Badge
										variant="outline"
										role={mainStats.online ? "button" : undefined}
										tabIndex={mainStats.online ? 0 : undefined}
										className={`
                    ${
											mainStats.online
												? "cursor-pointer border-green-500/60 text-green-600 dark:text-green-400 hover:bg-green-500/10"
												: "border-red-500/60 text-red-600 dark:text-red-400"
										}
                      z-20 font-mono
                      `}
										onClick={
											mainStats.online && mainStats.server && onOnlineBadgeClick
												? (e) => {
														e.stopPropagation();
														onOnlineBadgeClick(mainStats.server!);
													}
												: undefined
										}
										onKeyDown={
											mainStats.online && mainStats.server && onOnlineBadgeClick
												? (e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault();
															e.stopPropagation();
															onOnlineBadgeClick(mainStats.server!);
														}
													}
												: undefined
										}
									>
										<span
											className={
												mainStats.online
													? "size-2 shrink-0 rounded-full bg-green-500"
													: "size-2 shrink-0 rounded-full bg-red-500"
											}
											aria-hidden
										/>
										{mainStats.online
											? `Online · ${mainStats.server}`
											: "Offline"}
									</Badge>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
			<p
				className="flex flex-col items-center gap-1 text-center font-sans text-sm text-muted-foreground mt-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
				aria-hidden
			>
				<span className="h-1.5 w-8 rounded-full bg-muted-foreground/50" />
				Click to view detail
			</p>
		</div>
	);
}

export default function MainPage() {
	const [data, setData] = useState<{
		[k: string]: {
			mainStats: PlayerMainStats | null;
			loading: boolean;
			error: string | null;
		};
	}>(() =>
		Object.fromEntries(
			FEATURED_USERNAMES.map((u) => [
				u,
				{ mainStats: null, loading: true, error: null },
			]),
		),
	);

	const router = useRouter();
	const [onlineDialogOpen, setOnlineDialogOpen] = useState(false);
	const [onlineDialogServer, setOnlineDialogServer] = useState<string | null>(
		null,
	);

	const openPlayerPage = useCallback(
		(username: string) => {
			router.push(`/${encodeURIComponent(username)}`);
		},
		[router],
	);

	const openOnlineListDialog = useCallback((server: string) => {
		setOnlineDialogServer(server);
		setOnlineDialogOpen(true);
	}, []);

	const handleOnlineDialogOpenChange = useCallback((open: boolean) => {
		setOnlineDialogOpen(open);
		if (!open) setOnlineDialogServer(null);
	}, []);

	const REFETCH_MS = 2 * 60 * 1000; // 2 min

	useEffect(() => {
		const fetchAll = () => {
			FEATURED_USERNAMES.forEach((username) => {
				getPlayerMainStats(username)
					.then((res) => {
						if (isMainStats(res)) {
							setData((prev) => ({
								...prev,
								[username]: {
									mainStats: res,
									loading: false,
									error: null,
								},
							}));
						} else {
							setData((prev) => ({
								...prev,
								[username]: {
									mainStats: null,
									loading: false,
									error: "Multiple players match; use UUID",
								},
							}));
						}
					})
					.catch((e) => {
						setData((prev) => ({
							...prev,
							[username]: {
								mainStats: null,
								loading: false,
								error: e instanceof Error ? e.message : "Failed to load",
							},
						}));
					});
			});
		};

		fetchAll();
		const interval = setInterval(fetchAll, REFETCH_MS);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="min-h-screen bg-background py-8 px-4">
			<main className="flex min-h-screen flex-col gap-4 items-center justify-center ">
				<h2 className="mb-6 text-center text-6xl lg:text-9xl font-pixel-circle">
					<span className="text-emerald-400">Wynn</span> Project
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full max-w-7xl mx-auto">
					{FEATURED_USERNAMES.map((username) => (
						<FeaturedPlayerSection
							key={username}
							username={username}
							mainStats={data[username]?.mainStats ?? null}
							loading={data[username]?.loading ?? true}
							error={data[username]?.error ?? null}
							onCardClick={openPlayerPage}
							onOnlineBadgeClick={openOnlineListDialog}
						/>
					))}
				</div>
			</main>
			<div className="w-full max-w-7xl mx-auto">
				<ArticlesSection />
			</div>
			<OnlinePlayersDialog
				open={onlineDialogOpen}
				onOpenChange={handleOnlineDialogOpenChange}
				server={onlineDialogServer}
				featuredUsernames={FEATURED_USERNAMES}
			/>
		</div>
	);
}
