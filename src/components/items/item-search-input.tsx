"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, tierRoman } from "@/lib/utils";
import { getRarityStyles } from "@/lib/rarity-color";
import { getItemDatabaseFull } from "@/api/item";
import { getTradeListingsForItem } from "@/api/wynnventory/trademarket";
import { ItemIcon } from "@/lib/item-icons";
import type { ItemDatabase } from "@/types/item";
import type { TradeListing } from "@/types/wynnventory/trademarket";

const DEBOUNCE_MS = 200;
const MAX_RESULTS = 50;
const PAGE_SIZE = 50;

interface ResultItem {
	name: string;
	listing: TradeListing;
}

interface Props {
	value: string;
	onChange: (value: string) => void;
	onSelect: (name: string, tier?: number | null) => void;
	onEnterSubmit?: (value: string) => void;
	onClear?: () => void;
	placeholder?: string;
	className?: string;
}

export function ItemSearchInput({
	value,
	onChange,
	onSelect,
	onEnterSubmit,
	onClear,
	placeholder = "Search items...",
	className,
}: Props) {
	const [db, setDb] = useState<ItemDatabase>({});
	const [results, setResults] = useState<ResultItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const abortRef = useRef<AbortController | null>(null);

	// Load full DB once for icon lookup
	useEffect(() => {
		getItemDatabaseFull()
			.then(setDb)
			.catch(() => {});
	}, []);

	// Debounced search via trade listings endpoint
	useEffect(() => {
		if (!value.trim()) {
			setResults([]);
			setOpen(false);
			setLoading(false);
			return;
		}
		const t = setTimeout(() => {
			abortRef.current?.abort();
			abortRef.current = new AbortController();
			const signal = abortRef.current.signal;
			setLoading(true);
			getTradeListingsForItem(value.trim(), { page_size: PAGE_SIZE })
				.then((res) => {
					if (signal.aborted) return;
					// One entry per (name + tier), lowest price each
					const seen = new Map<string, TradeListing>();
					for (const item of res.items) {
						const key = `${item.name}__${item.tier ?? "null"}`;
						const existing = seen.get(key);
						if (!existing || item.listing_price < existing.listing_price) {
							seen.set(key, item);
						}
					}
					const deduped = Array.from(seen.values())
						.sort((a, b) => {
							if (a.tier != null && b.tier != null) return a.tier - b.tier;
							if (a.tier != null) return -1;
							if (b.tier != null) return 1;
							return 0;
						})
						.slice(0, MAX_RESULTS)
						.map((listing) => ({ name: listing.name, listing }));
					setResults(deduped);
					setOpen(deduped.length > 0);
					setActiveIndex(-1);
				})
				.catch(() => {
					if (!signal.aborted) {
						setResults([]);
						setOpen(false);
					}
				})
				.finally(() => {
					if (!signal.aborted) setLoading(false);
				});
		}, DEBOUNCE_MS);
		return () => {
			clearTimeout(t);
			abortRef.current?.abort();
		};
	}, [value]);

	// Close on outside click
	useEffect(() => {
		function handle(e: MouseEvent) {
			if (!containerRef.current?.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, []);

	function select(name: string, tier?: number | null) {
		onSelect(name, tier);
		onChange(name);
		setOpen(false);
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			if (open && activeIndex >= 0) {
				e.preventDefault();
				const r = results[activeIndex];
				select(r.name, r.listing.tier);
			} else if (onEnterSubmit) {
				e.preventDefault();
				onEnterSubmit(value);
			}
			setOpen(false);
			return;
		}
		if (!open) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(i + 1, results.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Escape") {
			setOpen(false);
		}
	}

	function handleChange(v: string) {
		onChange(v);
		setActiveIndex(-1);
		if (!v.trim()) {
			setResults([]);
			setOpen(false);
		}
	}

	return (
		<div ref={containerRef} className={cn("relative min-w-0", className)}>
			{loading ? (
				<Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10 animate-spin" />
			) : (
				<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
			)}
			<Input
				ref={inputRef}
				placeholder={placeholder}
				value={value}
				onChange={(e) => handleChange(e.target.value)}
				onKeyDown={handleKeyDown}
				onFocus={() => (results.length > 0 || loading) && setOpen(true)}
				className="pl-9 pr-8 "
				autoComplete="off"
			/>
			{value && (
				<button
					type="button"
					onClick={() => {
						onChange("");
						onSelect("", null);
						onClear?.();
						setResults([]);
						setOpen(false);
						inputRef.current?.focus();
					}}
					className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
				>
					<X className="size-3.5" />
				</button>
			)}

			{open && (loading || results.length > 0) && (
				<ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(16rem,50vh)] overflow-y-auto rounded-md border border-border bg-popover shadow-md">
					{loading && results.length === 0 ? (
						<li className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin shrink-0" />
							Searching...
						</li>
					) : (
						results.map(({ name, listing }, i) => {
							const rawRarity = listing.rarity ?? "";
							const rarity =
								rawRarity.charAt(0).toUpperCase() +
								rawRarity.slice(1).toLowerCase();
							const { border } = getRarityStyles(rarity);
							const tier = listing.tier;
							const listKey = `${name}__${tier ?? "null"}`;
							return (
								<li
									key={listKey}
									className={cn(
										i < results.length - 1 && "border-b border-border",
									)}
								>
									<button
										type="button"
										onMouseDown={(e) => {
											e.preventDefault();
											select(name, listing.tier);
										}}
										className={cn(
											"flex h-full w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
											i === activeIndex
												? "bg-accent text-accent-foreground"
												: "hover:bg-accent/60",
										)}
									>
										<span
											className={cn(
												"flex shrink-0 overflow-hidden rounded border-2 p-1",
												border.split(" ")[0],
											)}
										>
											<ItemIcon
												item={db[name] ?? name}
												alt={name}
												className="size-8"
											/>
										</span>
										<span className="truncate flex-1 text-md ">
											{name} {tier ? ` ${tierRoman(tier)}` : ""}
										</span>
									</button>
								</li>
							);
						})
					)}
				</ul>
			)}
		</div>
	);
}
