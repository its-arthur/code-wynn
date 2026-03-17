export default function LootpoolLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen max-w-6xl mx-auto">
			<header className="border-b border-border/40 px-4 py-4">
				<h1 className="font-pixel-circle text-8xl tracking-wide text-foreground">
				Raids & <br />
				Lootruns
				</h1>
				<div className="mt-2 ml-4 flex items-center gap-3 w-full">
					<p className="text-sm text-muted-foreground w-fit">
						Current active lootrun rewards.
					</p>
					<div className="h-px min-w-0 flex-1 bg-white" aria-hidden />
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
		</div>
	);
}
