"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Package, Swords, Coins, Store, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
	{ href: "/", label: "Home", icon: Home },
	// { href: "/items", label: "Items", icon: Package },
	{ href: "/rewards", label: "Rewards", icon: Coins },
	{ href: "/trademarket", label: "Market", icon: Store },
] as const;

function NavLink({
	href,
	label,
	icon: Icon,
	active,
	onClick,
	className,
}: {
	href: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	active: boolean;
	onClick?: () => void;
	className?: string;
}) {
	return (
		<Link
			href={href}
			onClick={onClick}
			className={cn(
				"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
				active
					? "bg-accent text-accent-foreground"
					: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
				className,
			)}
		>
			<Icon className="size-4 shrink-0" aria-hidden />
			{label}
		</Link>
	);
}

export function Navbar() {
	const pathname = usePathname();
	const [sheetOpen, setSheetOpen] = useState(false);

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
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-linear-to-b from-background/80 via-transparent to-transparent backdrop-blur-md">
			<nav className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
				{/* Mobile: hamburger menu */}
				<div className="flex sm:hidden z-10">
					<Sheet open={sheetOpen} onOpenChange={setSheetOpen} >
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Open menu"
								className="shrink-0"
							>
								<Menu className="size-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-[min(85vw,280px)]">
							<SheetHeader>
								<SheetTitle className="sr-only">Navigation</SheetTitle>
							</SheetHeader>
							<div className="flex flex-col gap-1 pt-4">
								{navItems.map(({ href, label, icon }) => (
									<NavLink
										key={href}
										href={href}
										label={label}
										icon={icon}
										active={isActive(href)}
										onClick={() => setSheetOpen(false)}
										className="w-full justify-start py-3"
									/>
								))}
							</div>
						</SheetContent>
					</Sheet>
				</div>

				{/* Desktop: centered nav links */}
				<div className="hidden sm:flex flex-1 items-center justify-center gap-1">
					{navItems.map(({ href, label, icon }) => (
						<NavLink
							key={href}
							href={href}
							label={label}
							icon={icon}
							active={isActive(href)}
						/>
					))}
				</div>

				{/* Mobile: centered brand (absolute so hamburger doesn't affect it) */}
				<div className="sm:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
					<span className="font-pixel-circle text-lg text-foreground truncate max-w-[50vw]">
						project-wynn
					</span>
				</div>
			</nav>
		</header>
	);
}
