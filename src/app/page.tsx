"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestNews } from "@/api/news";
import { getPlayerMainStats } from "@/api/player";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { OnlinePlayersDialog } from "@/components/online-players-dialog";
import { PlayerSkin } from "@/components/player-skin";
import { rankBadgeUrl } from "@/lib/utils";
import { FEATURED_USERNAMES } from "@/data/featured-users";
import type {
  PlayerMainStats,
  PlayerMainStatsResponse,
} from "@/types/player";
import type { NewsItem } from "@/types/news";

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
                className="font-minecraft inline-block px-1.5 py-0.5 text-2xl text-[#ffff55]"
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
                      z-20 font-mono
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

  const router = useRouter();
  const [onlineDialogOpen, setOnlineDialogOpen] = useState(false);
  const [onlineDialogServer, setOnlineDialogServer] = useState<string | null>(
    null
  );

  const openPlayerPage = useCallback(
    (username: string) => {
      router.push(`/${encodeURIComponent(username)}`);
    },
    [router]
  );

  const openOnlineListDialog = useCallback((server: string) => {
    setOnlineDialogServer(server);
    setOnlineDialogOpen(true);
  }, []);

  const handleOnlineDialogOpenChange = useCallback((open: boolean) => {
    setOnlineDialogOpen(open);
    if (!open) setOnlineDialogServer(null);
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

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  useEffect(() => {
    getLatestNews()
      .then(setNews)
      .catch((e) => setNewsError(e instanceof Error ? e.message : "Failed to load news"))
      .finally(() => setNewsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen flex-col items-center px-4 py-8">
        <div className="grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
          {FEATURED_USERNAMES.map((username) => (
            <FeaturedPlayerSection
              key={username}
              username={username}
              mainStats={data[username]?.mainStats ?? null}
              loading={data[username]?.loading ?? true}
              error={data[username]?.error ?? null}
              onCardClick={openPlayerPage}
              onOnlineBadgeClick={openOnlineListDialog}
            />
          ))}
        </div>

        <section className="mt-16 w-full max-w-7xl">
          <h2 className="mb-6 text-center text-2xl font-semibold">News</h2>
          {newsLoading && (
            <p className="text-center text-sm text-muted-foreground">Loading news…</p>
          )}
          {newsError && (
            <p className="text-center text-sm text-destructive">{newsError}</p>
          )}
          {!newsLoading && !newsError && news.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <Card
                  key={item.forumThread}
                  className="cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/40"
                  onClick={() => window.open(item.forumThread, "_blank", "noopener,noreferrer")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      window.open(item.forumThread, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold leading-tight">{item.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.date.trim()} · {item.author}
                      {item.comments ? ` · ${item.comments} comments` : ""}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {item.content.replace(/<[^>]*>/g, "").replace(/&#039;/g, "'")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <OnlinePlayersDialog
        open={onlineDialogOpen}
        onOpenChange={handleOnlineDialogOpenChange}
        server={onlineDialogServer}
        featuredUsernames={FEATURED_USERNAMES}
      />
    </div>
  );
}
