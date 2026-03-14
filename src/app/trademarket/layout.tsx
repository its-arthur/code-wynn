export default function TradeMarketLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen">
			<div className="border-b border-border/40 bg-muted/30 px-4 py-3">
				<h1 className="text-lg font-semibold text-foreground">
					Trade Market
				</h1>
				<p className="text-sm text-muted-foreground">
					Browse live listings, price history, and market trends.
				</p>
			</div>
			<main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
		</div>
	);
}
