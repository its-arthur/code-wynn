"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ItemCard } from "@/components/market/item-card";
import { quickSearchItems, searchItems, getItemMetadata } from "@/api/item";
import type {
	ItemDatabase,
	ItemDatabasePaginated,
	ItemMetadata,
	ItemSearchBody,
} from "@/types/item";

function isPaginated(
	data: ItemDatabasePaginated | ItemDatabase,
): data is ItemDatabasePaginated {
	return "controller" in data && "results" in data;
}

export function SearchOverlay({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<ItemDatabase>({});
	const [loading, setLoading] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [metadata, setMetadata] = useState<ItemMetadata | null>(null);
	const [metaLoading, setMetaLoading] = useState(false);

	const [filterType, setFilterType] = useState<string>("");
	const [filterTier, setFilterTier] = useState<string>("");
	const [filterAttackSpeed, setFilterAttackSpeed] = useState<string>("");

	const hasFilters = filterType || filterTier || filterAttackSpeed;
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

	useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 100);
		} else {
			setQuery("");
			setResults({});
			setShowFilters(false);
			setFilterType("");
			setFilterTier("");
			setFilterAttackSpeed("");
		}
	}, [open]);

	useEffect(() => {
		if (open && showFilters && !metadata && !metaLoading) {
			setMetaLoading(true);
			getItemMetadata()
				.then(setMetadata)
				.catch(() => {})
				.finally(() => setMetaLoading(false));
		}
	}, [open, showFilters, metadata, metaLoading]);

	const doSearch = useCallback(
		(text: string, type: string, tier: string, speed: string) => {
			const trimmed = text.trim();
			const anyFilter = type || tier || speed;

			if (!trimmed && !anyFilter) {
				setResults({});
				return;
			}

			setLoading(true);

			if (anyFilter) {
				const body: ItemSearchBody = {};
				if (trimmed) body.query = [trimmed];
				if (type) body.type = type;
				if (tier) body.tier = tier;
				if (speed) body.attackSpeed = speed;

				searchItems(body, true)
					.then((data) => {
						setResults(isPaginated(data) ? data.results : data);
					})
					.catch(() => setResults({}))
					.finally(() => setLoading(false));
			} else {
				quickSearchItems(trimmed)
					.then(setResults)
					.catch(() => setResults({}))
					.finally(() => setLoading(false));
			}
		},
		[],
	);

	const triggerSearch = useCallback(
		(text: string, type: string, tier: string, speed: string) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				doSearch(text, type, tier, speed);
			}, 350);
		},
		[doSearch],
	);

	useEffect(() => {
		triggerSearch(query, filterType, filterTier, filterAttackSpeed);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, filterType, filterTier, filterAttackSpeed, triggerSearch]);

	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, onClose]);

	if (!open) return null;

	const entries = Object.entries(results);

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-6 pb-4">
				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							ref={inputRef}
							placeholder="Search items by name..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Button
						variant={showFilters ? "secondary" : "outline"}
						size="icon"
						onClick={() => setShowFilters((v) => !v)}
						aria-label="Toggle filters"
					>
						<SlidersHorizontal className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						aria-label="Close search"
					>
						<X className="size-4" />
					</Button>
				</div>

				{showFilters && (
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={filterType}
							onValueChange={(v) => setFilterType(v === "all" ? "" : v)}
						>
							<SelectTrigger className="w-[130px]" size="sm">
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								{(metadata?.filters.type ?? []).map((t) => (
									<SelectItem key={t} value={t}>
										<span className="capitalize">{t}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={filterTier}
							onValueChange={(v) => setFilterTier(v === "all" ? "" : v)}
						>
							<SelectTrigger className="w-[130px]" size="sm">
								<SelectValue placeholder="Tier" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All tiers</SelectItem>
								{(metadata?.filters.tier.items ?? []).map((t) => (
									<SelectItem key={t} value={t}>
										<span className="capitalize">{t}</span>
									</SelectItem>
								))}
								{(metadata?.filters.tier.ingredients ?? []).map((n) => (
									<SelectItem key={`ing-${n}`} value={String(n)}>
										Tier {n}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={filterAttackSpeed}
							onValueChange={(v) =>
								setFilterAttackSpeed(v === "all" ? "" : v)
							}
						>
							<SelectTrigger className="w-[150px]" size="sm">
								<SelectValue placeholder="Attack Speed" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All speeds</SelectItem>
								{(metadata?.filters.advanced.attackSpeed ?? []).map((s) => (
									<SelectItem key={s} value={s}>
										<span className="capitalize">
											{s.replace(/([A-Z])/g, " $1").trim()}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{hasFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setFilterType("");
									setFilterTier("");
									setFilterAttackSpeed("");
								}}
							>
								Clear
							</Button>
						)}
					</div>
				)}
			</div>

			<div className="flex-1 overflow-y-auto px-4 pb-8">
				<div className="mx-auto max-w-3xl">
					{loading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="size-6 animate-spin text-muted-foreground" />
						</div>
					) : entries.length > 0 ? (
						<>
							<p className="mb-3 text-xs text-muted-foreground">
								{entries.length} result{entries.length !== 1 ? "s" : ""}
							</p>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
								{entries.map(([name, item]) => (
									<ItemCard key={name} name={name} item={item} />
								))}
							</div>
						</>
					) : query || hasFilters ? (
						<p className="py-20 text-center text-sm text-muted-foreground">
							No items found.
						</p>
					) : (
						<p className="py-20 text-center text-sm text-muted-foreground">
							Start typing or apply filters to search items.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
