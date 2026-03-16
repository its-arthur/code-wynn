export default function TradeMarketLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen max-w-6xl mx-auto">
			<header className="border-b border-border/40 px-4 py-4">
				<h1 className="font-pixel-square text-6xl tracking-wide text-foreground">
					Trade Market
				</h1>
				<div className="mt-2 flex items-center gap-3">
					<div className="h-px w-12 shrink-0 bg-white" aria-hidden />
					<p className="text-sm text-muted-foreground">
						Browse and search items from the Wynncraft trade market
					</p>
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
		</div>
	);
}
