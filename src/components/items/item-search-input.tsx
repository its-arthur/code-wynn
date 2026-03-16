"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, tierRoman } from "@/lib/utils";
import { getItemDatabaseFull } from "@/api/item";
import { getTradeListingsForItem } from "@/api/wynnventory/trademarket";
import { ItemIcon } from "@/lib/item-icons";
import { EmeraldPrice } from "@/components/emerald-price";
import type { ItemDatabase } from "@/types/item";
import type { TradeListing } from "@/types/wynnventory/trademarket";

const DEBOUNCE_MS = 350;
const MAX_RESULTS = 10;

const TIER_ROMAN: Record<number, string> = { 0: "0", 1: "I", 2: "II", 3: "III" };

const RARITY_COLORS: Record<string, string> = {
	common: "text-gray-400",
	unique: "text-yellow-300",
	rare: "text-pink-400",
	legendary: "text-cyan-300",
	set: "text-green-400",
	fabled: "text-red-400",
	mythic: "text-purple-400",
};

interface ResultItem {
	name: string;
	listing: TradeListing;
}

interface Props {
	value: string;
	onChange: (value: string) => void;
	onSelect: (name: string, tier?: number | null) => void;
	placeholder?: string;
	className?: string;
}

export function ItemSearchInput({
	value,
	onChange,
	onSelect,
	placeholder = "Search items...",
	className,
}: Props) {
	const [db, setDb] = useState<ItemDatabase>({});
	const [results, setResults] = useState<ResultItem[]>([]);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Load full DB once for icon lookup
	useEffect(() => {
		getItemDatabaseFull().then(setDb).catch(() => {});
	}, []);

	// Debounced search via trade listings endpoint
	useEffect(() => {
		if (!value.trim()) {
			setResults([]);
			setOpen(false);
			return;
		}
		const t = setTimeout(() => {
			getTradeListingsForItem(value.trim(), { page_size: 100 })
				.then((res) => {
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
					setResults([]);
					setOpen(false);
				});
		}, DEBOUNCE_MS);
		return () => clearTimeout(t);
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
		if (!open) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(i + 1, results.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter" && activeIndex >= 0) {
			e.preventDefault();
			const r = results[activeIndex];
			select(r.name, r.listing.tier);
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
		<div ref={containerRef} className={cn("relative", className)}>
			<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
			<Input
				ref={inputRef}
				placeholder={placeholder}
				value={value}
				onChange={(e) => handleChange(e.target.value)}
				onKeyDown={handleKeyDown}
				onFocus={() => results.length > 0 && setOpen(true)}
				className="pl-9 pr-8"
				autoComplete="off"
			/>
			{value && (
				<button
					type="button"
					onClick={() => {
						onChange("");
						onSelect("", null);
						setResults([]);
						setOpen(false);
						inputRef.current?.focus();
					}}
					className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
				>
					<X className="size-3.5" />
				</button>
			)}

			{open && results.length > 0 && (
				<ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
					{results.map(({ name, listing }, i) => {
						const rarity = listing.rarity?.toLowerCase();
						const tier = listing.tier;
						return (
							<li key={name}>
								<button
									type="button"
									onMouseDown={(e) => {
										e.preventDefault();
										select(name, listing.tier);
									}}
									className={cn(
										"flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
										i === activeIndex
											? "bg-accent text-accent-foreground"
											: "hover:bg-accent/60",
									)}
								>
									<ItemIcon item={db[name] ?? name} alt={name} className="size-6 shrink-0" />
									<span className="truncate flex-1">{name} {tier ? ` ${tierRoman(tier)}` : ""}</span>

									<EmeraldPrice price={listing.listing_price} className="shrink-0 text-[10px]" />
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
