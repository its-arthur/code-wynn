"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getOnlinePlayerList } from "@/api/online";
import { CopySwitchButton } from "@/components/copy-switch-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { OnlinePlayerList } from "@/types/player";
import { FEATURED_USERNAMES } from "@/data/featured-users";

export interface OnlinePlayersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Server to fetch (e.g. "WC1"). When open and set, the list is fetched. */
  server: string | null;
  /** Usernames to highlight in the list (e.g. featured players). */
  featuredUsernames?: readonly string[] | string[];
}

export function OnlinePlayersDialog({
  open,
  onOpenChange,
  server,
  featuredUsernames = FEATURED_USERNAMES,
}: OnlinePlayersDialogProps) {
  const [onlineList, setOnlineList] = useState<OnlinePlayerList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !server) {
      if (!open) {
        setOnlineList(null);
        setError(null);
      }
      return;
    }
    setLoading(true);
    setError(null);
    getOnlinePlayerList({ server })
      .then((data) => {
        setOnlineList(data);
        setError(null);
      })
      .catch((e) => {
        setOnlineList(null);
        setError(e instanceof Error ? e.message : "Failed to load online list");
      })
      .finally(() => setLoading(false));
  }, [open, server]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setOnlineList(null);
        setError(null);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const playerCount =
    onlineList?.onlinePlayers ??
    (onlineList ? Object.keys(onlineList.players ?? {}).length : 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] w-[95vw] max-w-[95vw] overflow-hidden flex flex-col border-border/80 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-sans">
            {server ?? "…"} {server && <CopySwitchButton server={server} />} {playerCount > 0 ? <span className="text-sm font-mono text-muted-foreground">· {playerCount} player{playerCount === 1 ? "" : "s"} online</span> : "No players online"} 
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6 pt-4">
          {loading && (
            <div className="space-y-2 py-2">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-md" />
                ))}
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {!loading && !error && onlineList && (
            <div className="space-y-4 pb-6">
              <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {Object.keys(onlineList.players)
                  .sort((a, b) => a.localeCompare(b, "en-US"))
                  .map((name) => {
                    const isFeatured = featuredUsernames.includes(name);
                    return (
                      <li key={name}>
                        <Link
                          href={`/${encodeURIComponent(name)}`}
                          className={
                            isFeatured
                              ? "flex items-center gap-2.5 rounded-lg border-2 border-green-600/60 bg-green-600/10 px-3 py-2 font-medium shadow-sm transition-colors hover:bg-green-600/20"
                              : "flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50"
                          }
                          title={name}
                        >
                          <img
                            src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}`}
                            alt=""
                            className="size-8 shrink-0 rounded-md ring-1 ring-border/50"
                          />
                          <span className="min-w-0 truncate font-mono">{name}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
