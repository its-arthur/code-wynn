"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getPlayerFullStats } from "@/api/player";
import { PlayerFullStatsContent } from "@/components/player-full-stats";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlayerFullStats } from "@/types/player";

export default function PlayerNamePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const [fullStats, setFullStats] = useState<PlayerFullStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPlayerFullStats(name)
      .then((data) => {
        setFullStats(data);
        setError(null);
      })
      .catch((e) => {
        setFullStats(null);
        setError(e instanceof Error ? e.message : "Failed to load player");
      })
      .finally(() => setLoading(false));
  }, [name]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">← Back</Link>
          </Button>
        </div>

        {loading && (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
            <div>
              <Skeleton className="mb-4 h-6 w-32" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="space-y-4">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        )}
        {!loading && !error && fullStats && (
          <div>
            <PlayerFullStatsContent fullStats={fullStats} />
          </div>
        )}
      </main>
    </div>
  );
}
