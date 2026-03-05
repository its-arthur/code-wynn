"use client";

import { useState } from "react";
import { CopySwitchButton } from "@/components/copy-switch-button";
import { OnlinePlayersDialog } from "@/components/online-players-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateDDMonthYear, formatTimeElapsed, rankBadgeUrl } from "@/lib/utils";
import { PlayerSkin } from "@/components/player-skin";
import type {
  PlayerMainStats,
  PlayerFullStats,
  PlayerCharacterData,
} from "@/types/player";

const FIXED_LOCALE = "en-US";

function formatPlaytime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  if (days < 30) return `${days.toFixed(1)}d`;
  return `${(days / 30).toFixed(1)}mo`;
}

function formatNumber(n: number | null | undefined): string {
  if (n == null || typeof n !== "number") return "0";
  return n.toLocaleString(FIXED_LOCALE);
}

export function MainStatsCards({ mainStats }: { mainStats: PlayerMainStats }) {
  const [onlineDialogOpen, setOnlineDialogOpen] = useState(false);
  const [onlineDialogServer, setOnlineDialogServer] = useState<string | null>(
    null
  );

  const openOnlineDialog = (server: string) => {
    setOnlineDialogServer(server);
    setOnlineDialogOpen(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardContent className="flex flex-col gap-4">
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
              {mainStats.username}
            </span>
          </p>

          <div className="flex justify-center">
            <PlayerSkin username={mainStats.username} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col gap-1 ">
          <p className="text-2xl font-sans">Overview</p>
          <p className="font-mono text-muted-foreground">Account & status</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Status</CardTitle>
            <CardDescription className="flex gap-2 text-sm font-mono"> <p className="flex items-center gap-2">
              {mainStats.online && mainStats.server ? (
                <>
                  <button
                    type="button"
                    onClick={() => openOnlineDialog(mainStats.server!)}
                    className="font-medium text-green-600 dark:text-green-400 underline-offset-2 hover:underline"
                  >
                    Online · {mainStats.server}
                  </button>
                  <CopySwitchButton server={mainStats.server} />
                </>
              ) : (
                <span className="text-muted-foreground">Offline</span>
              )}
            </p>
              {!mainStats.online && (
                <p>
                  <span className="text-muted-foreground">- Last join</span>
                  <span className="ml-2">
                    {mainStats.lastJoin
                      ? formatTimeElapsed(mainStats.lastJoin)
                      : "—"}
                  </span>
                </p>
              )}</CardDescription>
          </CardHeader>
        </Card>
        <div className="flex gap-2 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="font-sans">Playtime</CardTitle>
              <CardDescription className="flex gap-2 text-sm font-mono">
                {formatPlaytime(mainStats.playtime)}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="font-sans">First join</CardTitle>
              <CardDescription className="flex gap-2 text-sm font-mono">
                {mainStats.firstJoin ? formatDateDDMonthYear(mainStats.firstJoin) : "—"}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

      </div>


      {/* <Card>
        <CardHeader>
          <CardTitle>Guild</CardTitle>
          <CardDescription>
            {mainStats.guild?.name || "Not in a guild"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {mainStats.guild?.name ? (
            <>
              <p>
                <span className="text-muted-foreground">Prefix</span> [
                {mainStats.guild.prefix}]
              </p>
              <p>
                <span className="text-muted-foreground">Rank</span>{" "}
                {mainStats.guild.rank} {mainStats.guild.rankStars}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No guild</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global stats</CardTitle>
          <CardDescription>Across all characters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Total levels</span>{" "}
            {formatNumber(
              mainStats.globalData.totalLevel ??
              mainStats.globalData.totalLevels
            )}
          </p>
          <p>
            <span className="text-muted-foreground">Mobs killed</span>{" "}
            {formatNumber(
              mainStats.globalData.mobsKilled ??
              mainStats.globalData.killedMobs
            )}
          </p>
          <p>
            <span className="text-muted-foreground">Chests found</span>{" "}
            {formatNumber(mainStats.globalData.chestsFound)}
          </p>
          <p>
            <span className="text-muted-foreground">Quests</span>{" "}
            {mainStats.globalData.completedQuests}
          </p>
          <p>
            <span className="text-muted-foreground">Dungeons</span>{" "}
            {mainStats.globalData.dungeons.total}
          </p>
          <p>
            <span className="text-muted-foreground">Raids</span>{" "}
            {mainStats.globalData.raids.total}
          </p>
          {mainStats.globalData.contentCompletion != null && (
            <p>
              <span className="text-muted-foreground">Content completion</span>{" "}
              {mainStats.globalData.contentCompletion}
            </p>
          )}
          {mainStats.globalData.worldEvents != null && (
            <p>
              <span className="text-muted-foreground">World events</span>{" "}
              {mainStats.globalData.worldEvents}
            </p>
          )}
          {mainStats.globalData.lootruns != null && (
            <p>
              <span className="text-muted-foreground">Loot runs</span>{" "}
              {mainStats.globalData.lootruns}
            </p>
          )}
          {mainStats.globalData.caves != null && (
            <p>
              <span className="text-muted-foreground">Caves</span>{" "}
              {mainStats.globalData.caves}
            </p>
          )}
          {mainStats.globalData.guildRaids != null && (
            <p>
              <span className="text-muted-foreground">Guild raids</span>{" "}
              {mainStats.globalData.guildRaids.total}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">PvP</span>{" "}
            {formatNumber(mainStats.globalData.pvp?.kills ?? 0)} K /{" "}
            {formatNumber(mainStats.globalData.pvp?.deaths ?? 0)} D
          </p>
        </CardContent>
      </Card> */}

      {/* {mainStats.ranking && Object.keys(mainStats.ranking).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ranking</CardTitle>
            <CardDescription>Leaderboard positions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {Object.entries(mainStats.ranking)
                .sort(([, a], [, b]) => a - b)
                .map(([name, pos]) => (
                  <li key={name}>
                    <img
                      src={`https://cdn.wynncraft.com/nextgen/leaderboard/icons/${name.replace(/([A-Z])/g, " $1").split(" ")[0]}.webp`}
                      alt={name.replace(/([A-Z])/g, " $1").split(" ")[0]}
                      className="h-5 w-auto inline-block align-middle capitalize"
                    />
                    <span className="text-muted-foreground capitalize">
                      {name.replace(/([A-Z])/g, " $1").trim()}
                    </span>{" "}
                    #{formatNumber(pos)}
                  </li>
                ))}
              {Object.keys(mainStats.ranking).length > 15 && (
                <li className="text-muted-foreground">
                  +{Object.keys(mainStats.ranking).length - 15} more
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )} */}
      <OnlinePlayersDialog
        open={onlineDialogOpen}
        onOpenChange={(open) => {
          setOnlineDialogOpen(open);
          if (!open) setOnlineDialogServer(null);
        }}
        server={onlineDialogServer}
      />
    </>
  );
}

function CharacterFullCard({ char }: { char: PlayerCharacterData }) {
  const hasSkills =
    char.skillPoints && Object.keys(char.skillPoints).length > 0;
  const hasProfessions =
    char.professions && Object.keys(char.professions).length > 0;
  const def = char.skillPoints?.defence ?? char.skillPoints?.defense;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {char.nickname} · {char.type}
          {char.reskin != null && char.reskin !== char.type && (
            <span className="text-muted-foreground font-normal">
              {" "}
              (reskin: {char.reskin})
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Lv {char.level} (Total {char.totalLevel})
          {char.xp != null && ` · XP ${formatNumber(char.xp)} (${char.xpPercent ?? 0}%)`}
          {char.gamemode?.length ? ` · ${char.gamemode.join(", ")}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {char.playtime != null && (
          <p>
            <span className="text-muted-foreground">Playtime</span>{" "}
            {formatPlaytime(char.playtime)}
          </p>
        )}
        {hasSkills && char.skillPoints && (
          <p>
            <span className="text-muted-foreground">Skills</span>{" "}
            {[
              char.skillPoints.strength != null && `STR ${char.skillPoints.strength}`,
              char.skillPoints.dexterity != null && `DEX ${char.skillPoints.dexterity}`,
              char.skillPoints.intelligence != null && `INT ${char.skillPoints.intelligence}`,
              def != null && `DEF ${def}`,
              char.skillPoints.agility != null && `AGI ${char.skillPoints.agility}`,
            ]
              .filter(Boolean)
              .join(" ")}
          </p>
        )}
        {hasProfessions && char.professions && (
          <p>
            <span className="text-muted-foreground">Professions</span>{" "}
            {Object.entries(char.professions)
              .map(([name, p]) => (
                <span key={name} className="inline-flex items-center mr-2">
                  <img
                    src={`https://cdn.wynncraft.com/nextgen/leaderboard/icons/${name}.webp`}
                    alt={name}
                    className="inline-block h-5 w-5 mr-1 align-middle"
                  />
                  {name} {p.level}
                  {p.xpPercent != null ? ` (${p.xpPercent}%)` : ""}
                </span>
              ))
              .reduce(
                (prev, curr) =>
                  prev === null
                    ? [curr]
                    : [...prev, <span key={Math.random()}> · </span>, curr],
                null as React.ReactNode[] | null
              )}
          </p>
        )}
        {char.dungeons && char.dungeons.total != null && (
          <p>
            <span className="text-muted-foreground">Dungeons</span>{" "}
            {char.dungeons.total}
            {char.dungeons.list &&
              Object.keys(char.dungeons.list).length > 0 &&
              ` (${Object.entries(char.dungeons.list)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")})`}
          </p>
        )}
        {char.raids && char.raids.total != null && (
          <p>
            <span className="text-muted-foreground">Raids</span>{" "}
            {char.raids.total}
            {char.raids.list &&
              Object.keys(char.raids.list).length > 0 &&
              ` (${Object.entries(char.raids.list)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")})`}
          </p>
        )}
        {char.quests && char.quests.length > 0 && (
          <p>
            <span className="text-muted-foreground">Quests</span>{" "}
            {char.quests.length} completed
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const CLASS_ICON_BASE =
  "https://cdn.wynncraft.com/nextgen/classes/icons/artboards";

function CharacterCard({
  char,
  onClick,
}: {
  char: PlayerCharacterData;
  onClick: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer overflow-hidden border-border/80 bg-card/50 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="p-4 pb-0">
        <div className="relative mx-auto aspect-square w-full max-w-[200px] p-4 overflow-hidden rounded-xl bg-muted/20 ring-1 ring-border/50 transition-all duration-200 group-hover:ring-primary/40">
          <img
            src={`${CLASS_ICON_BASE}/${char.type.toLowerCase()}.webp`}
            alt={char.type}
            className="size-full object-contain object-center transition-transform duration-200 group-hover:scale-105"
          />
        </div>
      </div>
      <CardContent className="flex flex-col items-center gap-2 p-4 pt-3 text-center">
        <span
          className="font-semibold tracking-tight truncate w-full"
          title={char.type}
        >
          {char.type}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Lv {char.level}
          </span>
          {char.playtime != null && (
            <span className="text-xs text-muted-foreground">
              {formatPlaytime(char.playtime)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PlayerFullStatsContent({ fullStats }: { fullStats: PlayerFullStats }) {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const characterEntries = Object.entries(fullStats.characters ?? {});
  const selectedChar = selectedUuid ? fullStats.characters[selectedUuid] : null;

  return (
    <div className="w-full">
      {/* Overview panel */}
      <section className="rounded-xl border border-border/80 bg-card/50 p-4 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <MainStatsCards mainStats={fullStats} />
        </div>
      </section>

      {/* Classes panel */}
      {characterEntries.length > 0 && (
        <section className="mt-8 rounded-xl border border-border/80 bg-card/50 p-4 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-3">
            <div className="h-8 w-1 rounded-full bg-primary/70" />
            <div>
              <h3 className="font-sans">Classes</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {characterEntries.length} character{characterEntries.length === 1 ? "" : "s"} · click to view details
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {characterEntries.map(([uuid, char]) => (
              <CharacterCard
                key={uuid}
                char={char}
                onClick={() => setSelectedUuid(uuid)}
              />
            ))}
          </div>
        </section>
      )}

      <Dialog open={!!selectedUuid} onOpenChange={(open) => !open && setSelectedUuid(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden flex flex-col border-2 border-border/80 shadow-xl">
          <DialogHeader className="space-y-1 border-b border-border/60 pb-4">
            <DialogTitle className="text-lg">
              {selectedChar ? `${selectedChar.type} · ${selectedChar.nickname}` : "Character"}
            </DialogTitle>
            {selectedChar && (
              <p className="text-sm text-muted-foreground">
                Lv {selectedChar.level}
                {selectedChar.playtime != null && ` · ${formatPlaytime(selectedChar.playtime)} playtime`}
              </p>
            )}
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6 pt-4">
            {selectedChar && (
              <CharacterFullCard char={selectedChar} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
