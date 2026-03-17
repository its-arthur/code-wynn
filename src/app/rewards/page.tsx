"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LootrunsContent } from "./components/lootruns";
import { RaidsContent } from "./components/raids";

export default function RewardsPage() {
	const [mode, setMode] = useState<"lootruns" | "raids">("lootruns");
	const [lootrunsLoading, setLootrunsLoading] = useState(false);
	const [raidsLoading, setRaidsLoading] = useState(false);

	const lootrunsRefreshRef = useRef<(() => void) | null>(null);
	const raidsRefreshRef = useRef<(() => void) | null>(null);

	const handleRefresh = useCallback(() => {
		if (mode === "lootruns") lootrunsRefreshRef.current?.();
		else raidsRefreshRef.current?.();
	}, [mode]);

	const loading = mode === "lootruns" ? lootrunsLoading : raidsLoading;

	return (
		<Tabs
			value={mode}
			onValueChange={(v) => setMode(v as "lootruns" | "raids")}
			className="space-y-4"
		>
			<div className="relative flex items-center justify-center ">
			<TabsList className="flex-wrap font-mono capitalize">
					<TabsTrigger value="lootruns">Lootruns</TabsTrigger>
					<TabsTrigger value="raids">Raids</TabsTrigger>
				</TabsList>
				<Button
					className="absolute right-0"
					variant="outline"
					size="sm"
					onClick={handleRefresh}
					disabled={loading}
				>
					{loading ? (
						<Loader2 className="animate-spin" />
					) : (
						<RefreshCw />
					)}
				</Button>
			</div>

			<TabsContent value="lootruns" forceMount className="mt-2 data-[state=inactive]:hidden">
				<LootrunsContent
					refreshRef={lootrunsRefreshRef}
					onLoadingChange={setLootrunsLoading}
				/>
			</TabsContent>

			<TabsContent value="raids" forceMount className="mt-2 data-[state=inactive]:hidden">
				<RaidsContent
					refreshRef={raidsRefreshRef}
					onLoadingChange={setRaidsLoading}
				/>
			</TabsContent>
		</Tabs>
	);
}
