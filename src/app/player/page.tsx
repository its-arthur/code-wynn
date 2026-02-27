"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePlayerStore } from "@/store/player-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { MainStatsCards, PlayerFullStatsContent } from "@/components/player-full-stats";
import type {
  PlayerMainStatsResponse,
  PlayerMainStats,
  PlayerFullStats,
} from "@/types/player";

function PlayerSearch() {
  const [query, setQuery] = useState("");
  const [fullStatsOpen, setFullStatsOpen] = useState(false);
  const {
    fetchMainStats,
    mainStatsResponse,
    mainStats,
    mainError,
    loadingMain,
    fetchFullStats,
    fullStats,
    loadingFull,
    fullError,
    fetchCharacterList,
    characterList,
    loadingCharacterList,
    currentIdentifier,
    clearPlayer,
  } = usePlayerStore();

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      try {
        await fetchMainStats(q);
      } catch {
        // error stored in store
      }
    },
    [query, fetchMainStats]
  );

  const handleLoadCharacters = useCallback(() => {
    if (currentIdentifier) fetchCharacterList(currentIdentifier);
  }, [currentIdentifier, fetchCharacterList]);

  const handleOpenFullStats = useCallback(async () => {
    if (!currentIdentifier) return;
    try {
      await fetchFullStats(currentIdentifier);
      setFullStatsOpen(true);
    } catch {
      // fullError set in store
    }
  }, [currentIdentifier, fetchFullStats]);

  const isMultiSelector = (data: PlayerMainStatsResponse): boolean => {
    if (!data || typeof data !== "object") return false;
    const first = Object.values(data)[0];
    return (
      first != null &&
      typeof first === "object" &&
      "storedName" in first &&
      !("username" in data)
    );
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Username or UUID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
          disabled={loadingMain}
        />
        <Button type="submit" disabled={loadingMain}>
          {loadingMain ? "Searching…" : "Search"}
        </Button>
        {(mainStats || mainStatsResponse) && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQuery("");
              clearPlayer();
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {mainError && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">{mainError}</p>
          </CardContent>
        </Card>
      )}

      {mainStatsResponse && isMultiSelector(mainStatsResponse) && (
        <Card>
          <CardHeader>
            <CardTitle>Multiple players found</CardTitle>
            <CardDescription>
              Several names match. Search by UUID or choose an account below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {Object.entries(mainStatsResponse).map(([uuid, info]) => (
                <li key={uuid}>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setQuery(uuid);
                      fetchMainStats(uuid);
                    }}
                  >
                    {info.storedName} ({info.rank})
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {fullError && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">{fullError}</p>
          </CardContent>
        </Card>
      )}

      {mainStats && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Main stats</h2>
            <Button
              onClick={handleOpenFullStats}
              disabled={loadingFull}
              variant="secondary"
            >
              {loadingFull ? "Loading…" : "View full stats"}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MainStatsCards mainStats={mainStats} />
          </div>

          <Sheet open={fullStatsOpen} onOpenChange={setFullStatsOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-2xl overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle>
                  Full stats {fullStats ? `· ${fullStats.username}` : ""}
                </SheetTitle>
                <SheetDescription>
                  Overview, guild, global stats and all characters with
                  professions and skills.
                </SheetDescription>
              </SheetHeader>
              {fullStats ? (
                <PlayerFullStatsContent fullStats={fullStats} />
              ) : loadingFull ? (
                <p className="text-muted-foreground py-8">Loading full stats…</p>
              ) : null}
            </SheetContent>
          </Sheet>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Characters</CardTitle>
                <CardDescription>Load character list to see classes and levels</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadCharacters}
                disabled={loadingCharacterList}
              >
                {loadingCharacterList ? "Loading…" : "Load characters"}
              </Button>
            </CardHeader>
            {characterList && (
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {Object.entries(characterList).map(([uuid, char]) => (
                    <li
                      key={uuid}
                      className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{char.nickname}</span>
                      <span className="text-muted-foreground"> · {char.type}</span>
                      <p className="text-muted-foreground">
                        Lv {char.level} (Total {char.totalLevel})
                        {char.gamemode?.length ? ` · ${char.gamemode.join(", ")}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default function PlayerPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center gap-6 px-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            ← Home
          </Link>
          <h1 className="text-lg font-semibold">Player lookup</h1>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <PlayerSearch />
      </main>
    </div>
  );
}
