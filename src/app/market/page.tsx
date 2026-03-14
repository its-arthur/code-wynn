"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/components/market/item-card";
import { SearchOverlay } from "@/components/market/search-overlay";
import { getItemDatabasePaginated } from "@/api/item";
import type { ItemDatabase, ItemPaginationController } from "@/types/item";

export default function MarketPage() {
	const [items, setItems] = useState<ItemDatabase>({});
	const [controller, setController] = useState<ItemPaginationController | null>(
		null,
	);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchOpen, setSearchOpen] = useState(false);

	const fetchPage = useCallback((p: number) => {
		setLoading(true);
		setError(null);
		getItemDatabasePaginated(p)
			.then((data) => {
				setItems(data.results);
				setController(data.controller);
				setPage(data.controller.current);
			})
			.catch((e) => {
				setError(e instanceof Error ? e.message : "Failed to load items");
			})
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		fetchPage(1);
	}, [fetchPage]);

	const entries = Object.entries(items);
	const maxPage = controller?.pages ?? 1;

	const pageNumbers = (() => {
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
	})();

	return (
		<>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						{controller && !loading && (
							<p className="text-sm text-muted-foreground">
								{controller.count.toLocaleString()} items
								{" · "}page {controller.current} of {controller.pages}
							</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => fetchPage(page)}
							disabled={loading}
						>
							<RefreshCw className={loading ? "animate-spin" : ""} />
							Refresh
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSearchOpen(true)}
						>
							<Search />
							Search
						</Button>
					</div>
				</div>

				{error && (
					<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				)}

				{loading ? (
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 20 }).map((_, i) => (
							<Skeleton key={i} className="h-[76px] rounded-lg" />
						))}
					</div>
				) : (
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{entries.map(([name, item]) => (
							<ItemCard key={name} name={name} item={item} />
						))}
					</div>
				)}

				{!loading && controller && maxPage > 1 && (
					<div className="flex items-center justify-center gap-1 pt-2">
						<Button
							variant="outline"
							size="icon-sm"
							onClick={() => fetchPage(page - 1)}
							disabled={controller.prev == null}
							aria-label="Previous page"
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
									size="icon-sm"
									className="text-xs"
									onClick={() => fetchPage(p)}
								>
									{p}
								</Button>
							),
						)}

						<Button
							variant="outline"
							size="icon-sm"
							onClick={() => fetchPage(page + 1)}
							disabled={controller.next == null}
							aria-label="Next page"
						>
							›
						</Button>
					</div>
				)}
			</div>

			<SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
		</>
	);
}
