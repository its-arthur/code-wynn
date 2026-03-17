import Link from "next/link";

export function Footer() {
	return (
		<footer className="mt-auto border-t border-border/40 bg-background/50">
			<div className="mx-auto max-w-6xl px-4 py-6">
				<div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3">
					<p className="text-sm text-muted-foreground sm:text-left">
						© {new Date().getFullYear()} Project Wynn
					</p>
					<p className="text-sm text-muted-foreground text-center">
						Developed by{" "}
						<Link
							href="https://port-arthur.vercel.app/"
							target="_blank"
							className="text-white transition-colors hover:text-foreground"
						>
							Arthur
						</Link>
					</p>
					<p className="text-xs text-muted-foreground text-center sm:text-right">
						Data from{" "}
						<Link
							href="https://docs.wynncraft.com/docs/"
							target="_blank"
							className="text-white transition-colors hover:text-foreground"
						>
							Wynncraft API
						</Link>
						{" · "}
						<Link
							href="https://github.com/Wynnventory/WynnVentory_Mod"
							target="_blank"
							className="text-white transition-colors hover:text-foreground"
						>
							WynnVentory
						</Link>
					</p>
				</div>
			</div>
		</footer>
	);
}
