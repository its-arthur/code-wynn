"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlayerMainStats, getPlayerFullStats } from "@/api/player";
import { getOnlinePlayerList } from "@/api/online";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlayerFullStatsContent } from "@/components/player-full-stats";
import { PlayerSkin } from "@/components/player-skin";
import { rankBadgeUrl } from "@/lib/utils";
import { FEATURED_USERNAMES } from "@/data/featured-users";
import type {
  PlayerMainStats,
  PlayerMainStatsResponse,
  PlayerFullStats,
  OnlinePlayerList,
} from "@/types/player";

const FIXED_LOCALE = "en-US";

function isMainStats(
  data: PlayerMainStatsResponse
): data is PlayerMainStats {
  return (
    data != null &&
    typeof data === "object" &&
    "username" in data &&
    typeof (data as PlayerMainStats).username === "string"
  );
}

function FeaturedPlayerSection({
  username,
  mainStats,
  loading,
  error,
  onCardClick,
  onOnlineBadgeClick,
}: {
  username: string;
  mainStats: PlayerMainStats | null;
  loading: boolean;
  error: string | null;
  onCardClick: (username: string) => void;
  onOnlineBadgeClick?: (server: string) => void;
}) {
  return (
    <div className="relative group">
      <div className="absolute top-0 right-0 z-10 w-full h-full " onClick={() => onCardClick(username)} />
    <Card
        className="cursor-pointer transition-colors group-hover:bg-muted/50 group-hover:border-green-500/60"
      role="button"
        tabIndex={0}
    >
      <CardContent className="pt-6">
        <div className="space-y-4">
          <p className="flex flex-wrap items-center justify-center gap-2">
            {mainStats?.rankBadge && (
              <img
                src={rankBadgeUrl(mainStats.rankBadge)}
                alt={mainStats.rank}
                className="h-6 w-auto inline-block align-middle"
              />
            )}
            <span
              className="font-minecraft inline-block px-1.5 py-0.5 text-base text-[#ffff55]"
              style={{
                textShadow:
                  "1px 1px 0 #3f3f3f, -1px -1px 0 #3f3f3f, 1px -1px 0 #3f3f3f, -1px 1px 0 #3f3f3f",
              }}
            >
              {username}
            </span>
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <PlayerSkin username={username} />
            </div>

            {!loading && !error && mainStats && (
              <div className="flex justify-end gap-3">
                <Badge
                  variant="outline"
                  role={mainStats.online ? "button" : undefined}
                  tabIndex={mainStats.online ? 0 : undefined}
                    className={`
                    ${mainStats.online
                      ? "cursor-pointer border-green-500/60 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                      : "border-red-500/60 text-red-600 dark:text-red-400"}
                      z-20
                      `
                  }
                  onClick={
                    mainStats.online && mainStats.server && onOnlineBadgeClick
                      ? (e) => {
                          e.stopPropagation();
                          onOnlineBadgeClick(mainStats.server!);
                        }
                      : undefined
                  }
                  onKeyDown={
                    mainStats.online && mainStats.server && onOnlineBadgeClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            onOnlineBadgeClick(mainStats.server!);
                          }
                        }
                      : undefined
                  }
                >
                  <span
                    className={
                      mainStats.online
                        ? "size-2 shrink-0 rounded-full bg-green-500"
                        : "size-2 shrink-0 rounded-full bg-red-500"
                    }
                    aria-hidden
                  />
                  {mainStats.online
                    ? `Online · ${mainStats.server}`
                    : "Offline"}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </div>

  );
}

export default function MainPage() {
  const [data, setData] = useState<{
    [k: string]: {
      mainStats: PlayerMainStats | null;
      loading: boolean;
      error: string | null;
    };
  }>(() =>
    Object.fromEntries(
      FEATURED_USERNAMES.map((u) => [
        u,
        { mainStats: null, loading: true, error: null },
      ])
    )
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogUsername, setDialogUsername] = useState<string | null>(null);
  const [dialogFullStats, setDialogFullStats] = useState<PlayerFullStats | null>(
    null
  );
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [onlineDialogOpen, setOnlineDialogOpen] = useState(false);
  const [onlineDialogServer, setOnlineDialogServer] = useState<string | null>(
    null
  );
  const [onlineList, setOnlineList] = useState<OnlinePlayerList | null>(null);
  const [onlineListLoading, setOnlineListLoading] = useState(false);
  const [onlineListError, setOnlineListError] = useState<string | null>(null);

  const openFullStatsDialog = useCallback(async (username: string) => {
    setDialogUsername(username);
    setDialogOpen(true);
    setDialogFullStats(null);
    setDialogError(null);
    setDialogLoading(true);
    try {
      const fullStats = await getPlayerFullStats(username);
      setDialogFullStats(fullStats);
    } catch (e) {
      setDialogError(
        e instanceof Error ? e.message : "Failed to load full stats"
      );
    } finally {
      setDialogLoading(false);
    }
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setDialogUsername(null);
    setDialogFullStats(null);
    setDialogError(null);
  }, []);

  const openOnlineListDialog = useCallback(async (server: string) => {
    setOnlineDialogServer(server);
    setOnlineDialogOpen(true);
    setOnlineList(null);
    setOnlineListError(null);
    setOnlineListLoading(true);
    try {
      const data = await getOnlinePlayerList({ server });
      setOnlineList(data);
    } catch (e) {
      setOnlineListError(
        e instanceof Error ? e.message : "Failed to load online list"
      );
    } finally {
      setOnlineListLoading(false);
    }
  }, []);

  const closeOnlineDialog = useCallback(() => {
    setOnlineDialogOpen(false);
    setOnlineDialogServer(null);
    setOnlineList(null);
    setOnlineListError(null);
  }, []);

  useEffect(() => {
    FEATURED_USERNAMES.forEach((username) => {
      getPlayerMainStats(username)
        .then((res) => {
          if (isMainStats(res)) {
            setData((prev) => ({
              ...prev,
              [username]: {
                mainStats: res,
                loading: false,
                error: null,
              },
            }));
          } else {
            setData((prev) => ({
              ...prev,
              [username]: {
                mainStats: null,
                loading: false,
                error: "Multiple players match; use UUID",
              },
            }));
          }
        })
        .catch((e) => {
          setData((prev) => ({
            ...prev,
            [username]: {
              mainStats: null,
              loading: false,
              error: e instanceof Error ? e.message : "Failed to load",
            },
          }));
        });
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
          {FEATURED_USERNAMES.map((username) => (
            <FeaturedPlayerSection
              key={username}
              username={username}
              mainStats={data[username]?.mainStats ?? null}
              loading={data[username]?.loading ?? true}
              error={data[username]?.error ?? null}
              onCardClick={openFullStatsDialog}
              onOnlineBadgeClick={openOnlineListDialog}
            />
          ))}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-6xl flex flex-col !max-w-6xl sm:!max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              Full stats{dialogUsername ? ` · ${dialogUsername}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6">
            {dialogLoading && (
              <p className="text-muted-foreground text-sm py-4">
                Loading full stats…
              </p>
            )}
            {dialogError && (
              <p className="text-destructive text-sm py-4">{dialogError}</p>
            )}
            {!dialogLoading && !dialogError && dialogFullStats && (
              <PlayerFullStatsContent fullStats={dialogFullStats} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={onlineDialogOpen}
        onOpenChange={(open) => !open && closeOnlineDialog()}
      >
        <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Players on {onlineDialogServer ?? "…"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6">
            {onlineListLoading && (
              <p className="text-muted-foreground text-sm py-4">
                Loading players…
              </p>
            )}
            {onlineListError && (
              <p className="text-destructive text-sm py-4">
                {onlineListError}
              </p>
            )}
            {!onlineListLoading && !onlineListError && onlineList && (() => {
              const playerCount =
                onlineList.onlinePlayers ??
                Object.keys(onlineList.players ?? {}).length;
              return (
              <div className="space-y-3 pb-6">
                <p className="text-muted-foreground text-sm">
                  {playerCount} player
                  {playerCount === 1 ? "" : "s"} online
                </p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  {Object.keys(onlineList.players)
                    .sort((a, b) => a.localeCompare(b, "en-US"))
                    .map((name) => {
                      const isFeatured = (
                        FEATURED_USERNAMES as readonly string[]
                      ).includes(name);
                      return (
                        <li
                          key={name}
                          className={
                            isFeatured
                              ? "truncate rounded-md border-2 border-primary bg-primary/10 px-2.5 py-1.5 font-medium"
                              : "truncate rounded-md border border-border px-2.5 py-1.5"
                          }
                          title={name}
                        >
                          {name}
                        </li>
                      );
                    })}
                </ul>
              </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
