"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Store, Swords, Coins } from "lucide-react";

const navItems = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/market", label: "Market", icon: Store },
	{ href: "/raidpool", label: "Raids", icon: Swords },
	{ href: "/lootpool", label: "Lootpool", icon: Coins },
] as const;

export function Navbar() {
	const pathname = usePathname();
	const isActive = (href: string) => {
		if (href === "/") {
			if (pathname === "/") return true;
			const segments = pathname.split("/").filter(Boolean);
			const knownRoots = navItems
				.filter((n) => n.href !== "/")
				.map((n) => n.href.slice(1));
			return segments.length === 1 && !knownRoots.includes(segments[0]);
		}
		return pathname.startsWith(href);
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
			<nav className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4">
				{navItems.map(({ href, label, icon: Icon }) => {
					const active = isActive(href);
					return (
						<Link
							key={href}
							href={href}
							className={cn(
								"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
								active
									? "bg-accent text-accent-foreground"
									: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
							)}
						>
							<Icon className="size-4 shrink-0" aria-hidden />
							{label}
						</Link>
					);
				})}
			</nav>
		</header>
	);
}
