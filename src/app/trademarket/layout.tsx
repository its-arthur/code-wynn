export default function TradeMarketLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen">
			<main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
		</div>
	);
}
