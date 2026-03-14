"use client";

import type { Gambit } from "@/types/wynnventory/raidpool";

function parseMinecraftFormatting(text: string): string {
	return text.replace(/§[0-9a-fk-or]/gi, "");
}

export function GambitCard({ gambit }: { gambit: Gambit }) {
	return (
		<div className="rounded-lg border border-border/50 bg-muted/40 p-4 transition-colors hover:bg-muted/60">
			<div className="mb-2 flex items-center gap-2">
				<div
					className="size-3 rounded-full"
					style={{ backgroundColor: gambit.color }}
				/>
				<h4 className="font-medium text-sm">{gambit.name}</h4>
			</div>
			<div className="space-y-0.5">
				{gambit.description.map((line, i) => (
					<p key={i} className="text-xs text-muted-foreground">
						{parseMinecraftFormatting(line)}
					</p>
				))}
			</div>
		</div>
	);
}
