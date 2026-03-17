"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getOnlinePlayerList } from "@/api/online";
import { CopySwitchButton } from "@/components/copy-switch-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { OnlinePlayerList } from "@/types/player";
import { FEATURED_USERNAMES } from "@/data/featured-users";
import { RefreshCw, Search, X } from "lucide-react";

export interface OnlinePlayersDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Server to fetch (e.g. "WC1"). When open and set, the list is fetched. */
	server: string | null;
	/** Usernames to highlight in the list (e.g. featured players). */
	featuredUsernames?: readonly string[] | string[];
}

export function OnlinePlayersDialog({
	open,
	onOpenChange,
	server,
	featuredUsernames = FEATURED_USERNAMES,
}: OnlinePlayersDialogProps) {
	const [onlineList, setOnlineList] = useState<OnlinePlayerList | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const fetchList = useCallback(() => {
		if (!server) return;
		setLoading(true);
		setError(null);
		getOnlinePlayerList({ server })
			.then((data) => {
				setOnlineList(data);
				setError(null);
			})
			.catch((e) => {
				setOnlineList(null);
				setError(e instanceof Error ? e.message : "Failed to load online list");
			})
			.finally(() => setLoading(false));
	}, [server]);

	useEffect(() => {
		if (!open || !server) {
			if (!open) {
				setOnlineList(null);
				setError(null);
				setSearchQuery("");
			}
			return;
		}
		fetchList();
	}, [open, server, fetchList]);

	const handleOpenChange = useCallback(
		(next: boolean) => {
			if (!next) {
				setOnlineList(null);
				setError(null);
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);

	const playerCount =
		onlineList?.onlinePlayers ??
		(onlineList ? Object.keys(onlineList.players ?? {}).length : 0);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[85vh] w-[95vw] max-w-[95vw] overflow-hidden flex flex-col border-border/80 shadow-xl">
				<DialogHeader>
					<DialogTitle className="text-lg font-sans">
						{server ?? "…"} {server && <CopySwitchButton server={server} />}{" "}
						{playerCount > 0 ? (
							<span className="text-sm font-mono text-muted-foreground">
								· {playerCount} player{playerCount === 1 ? "" : "s"} online
							</span>
						) : (
							"No players online"
						)}
					</DialogTitle>
				</DialogHeader>
				<div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6">
					{loading && (
						<div className="space-y-2 py-2">
							<Skeleton className="h-4 w-32" />
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
								{[...Array(9)].map((_, i) => (
									<Skeleton key={i} className="h-9 rounded-md" />
								))}
							</div>
						</div>
					)}
					{error && (
						<div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-4">
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}
					{!loading && !error && onlineList && (
						<div className="space-y-4 pb-6">
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										type="search"
										placeholder="Search players..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-9 pr-9 font-mono [&::-webkit-search-cancel-button]:appearance-none"
										aria-label="Search players"
									/>
									{searchQuery.length > 0 && (
										<button
											type="button"
											onClick={() => setSearchQuery("")}
											className="hover:cursor-pointer absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white"
											title="Clear search"
											aria-label="Clear search"
										>
											<X className="h-4 w-4" />
										</button>
									)}
								</div>
								{server && (
									<Button
										variant="outline"
										size="icon"
										className="shrink-0"
										onClick={() => fetchList()}
										disabled={loading}
										title="Refresh list"
										aria-label="Refresh list"
									>
										<RefreshCw
											className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
										/>
									</Button>
								)}
							</div>
							{(() => {
								const q = searchQuery.toLowerCase();
								const matchesSearch = (name: string) =>
									name.toLowerCase().includes(q);
								const allNames = Object.keys(onlineList.players).filter(
									matchesSearch,
								);
								const featured = allNames
									.filter((name) => featuredUsernames.includes(name))
									.sort((a, b) => a.localeCompare(b, "en-US"));
								const other = allNames
									.filter((name) => !featuredUsernames.includes(name))
									.sort((a, b) => a.localeCompare(b, "en-US"));
								const playerLink = (name: string, className: string) => (
									<Link
										href={`/${encodeURIComponent(name)}`}
										className={className}
										title={name}
									>
										<Image
											src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}`}
											alt=""
											width={32}
											height={32}
											className="size-8 shrink-0 rounded-md ring-1 ring-border/50"
										/>
										<span className="min-w-0 truncate font-mono">{name}</span>
									</Link>
								);
								return (
									<>
										<section className="space-y-2">
											<div className="flex items-center gap-3">
												<h4 className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
													Featured
												</h4>
												<span className="h-px flex-1 bg-border" />
											</div>
											<ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
												{featured.map((name) => (
													<li key={name}>
														{playerLink(
															name,
															"flex items-center gap-2.5 rounded-lg border-2 border-green-600/60 bg-green-600/10 px-3 py-2 font-medium shadow-sm transition-colors hover:bg-green-600/20",
														)}
													</li>
												))}
											</ul>
										</section>
										<section className="space-y-2">
											<div className="flex items-center gap-3">
												<h4 className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
													Other players
												</h4>
												<span className="h-px flex-1 bg-border" />
											</div>
											<ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
												{other.map((name) => (
													<li key={name}>
														{playerLink(
															name,
															"flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50",
														)}
													</li>
												))}
											</ul>
										</section>
									</>
								);
							})()}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
