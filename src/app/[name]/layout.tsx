import { use } from "react";

export default function PlayerDetailsLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ name: string }>;
}) {
    const { name } = use(params);
	const decodedName = decodeURIComponent(name);
	return (
		<div className="min-h-screen max-w-6xl mx-auto">
			<header className="border-b border-border/40 px-4 py-4">
				<h1 className="font-pixel-circle text-8xl tracking-wide text-foreground">
					{decodedName}'s Profile
				</h1>
				<div className="mt-2 ml-4 flex items-center gap-3 w-full">
					<p className="text-sm text-muted-foreground w-fit">
						View details about {decodedName}
					</p>
					<div className="h-px min-w-0 flex-1 bg-white" aria-hidden />
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
		</div>
	);
}
