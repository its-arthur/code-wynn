"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  PlayerMainStats,
  PlayerFullStats,
  PlayerCharacterData,
} from "@/types/player";

const FIXED_LOCALE = "en-US";
const WYNN_API_BASE =
  process.env.NEXT_PUBLIC_WYNN_API_BASE ?? "https://cdn.wynncraft.com";
const MCVIEW3D_EMBED_BASE =
  process.env.NEXT_PUBLIC_MCVIEW3D_EMBED_BASE ??
  "https://kurojs.github.io/McView3D/embed.html";

function rankBadgeUrl(path: string): string {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${WYNN_API_BASE}/${clean}`;
}

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

function McView3DCard({ username }: { username: string }) {
  const embedSrc = `${MCVIEW3D_EMBED_BASE}?skin=${username}&width=400&height=400&animation=idle&cape=default`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player model</CardTitle>
        <CardDescription>3D skin preview (McView3D)</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center overflow-hidden rounded-lg bg-muted/30 p-2">
        <iframe
          src={embedSrc}
          width={400}
          height={400}
          title={`${username} skin viewer`}
          className="border-0 rounded"
        />
      </CardContent>
    </Card>
  );
}

export function MainStatsCards({ mainStats }: { mainStats: PlayerMainStats }) {
  return (
    <>
      <McView3DCard username={mainStats.username} />
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Account & status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Username</span>{" "}
            {mainStats.rankBadge && (
              <img
                src={rankBadgeUrl(mainStats.rankBadge)}
                alt={mainStats.rank}
                className="h-5 w-auto inline-block align-middle"
              />
            )}
            {mainStats.username}
          </p>
          <p>
            <span className="text-muted-foreground">Rank</span>{" "}
            {mainStats.rank}
            {mainStats.supportRank && ` · ${mainStats.supportRank}`}
            {mainStats.veteran === true && " (Veteran)"}
          </p>
          {mainStats.lastJoin && (
            <p>
              <span className="text-muted-foreground">Last join</span>{" "}
              {mainStats.lastJoin}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Status</span>{" "}
            <span
              className={
                mainStats.online
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground"
              }
            >
              {mainStats.online ? `Online · ${mainStats.server}` : "Offline"}
            </span>
          </p>
          {mainStats.activeCharacter && (
            <p>
              <span className="text-muted-foreground">Active</span>{" "}
              {mainStats.activeCharacter}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Playtime</span>{" "}
            {formatPlaytime(mainStats.playtime)}
          </p>
          <p>
            <span className="text-muted-foreground">First join</span>{" "}
            {mainStats.firstJoin}
          </p>
          {mainStats.rankBadge && (
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Rank badge</span>{" "}
              <img
                src={rankBadgeUrl(mainStats.rankBadge)}
                alt={mainStats.rank}
                className="h-5 w-auto inline-block align-middle"
              />
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
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
      </Card>

      {mainStats.ranking && Object.keys(mainStats.ranking).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ranking</CardTitle>
            <CardDescription>Leaderboard positions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {Object.entries(mainStats.ranking)
                .sort(([, a], [, b]) => a - b)
                .slice(0, 15)
                .map(([name, pos]) => (
                  <li key={name}>
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
      )}
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
        {char.mobsKilled != null && (
          <p>
            <span className="text-muted-foreground">Mobs killed</span>{" "}
            {formatNumber(char.mobsKilled)}
          </p>
        )}
        {char.blocksWalked != null && (
          <p>
            <span className="text-muted-foreground">Blocks walked</span>{" "}
            {formatNumber(char.blocksWalked)}
          </p>
        )}
        {char.chestsFound != null && (
          <p>
            <span className="text-muted-foreground">Chests found</span>{" "}
            {formatNumber(char.chestsFound)}
          </p>
        )}
        {char.logins != null && (
          <p>
            <span className="text-muted-foreground">Logins</span>{" "}
            {char.logins} · <span className="text-muted-foreground">Deaths</span>{" "}
            {char.deaths ?? "—"}
          </p>
        )}
        {char.discoveries != null && (
          <p>
            <span className="text-muted-foreground">Discoveries</span>{" "}
            {char.discoveries}
          </p>
        )}
        {char.contentCompletion != null && (
          <p>
            <span className="text-muted-foreground">Content completion</span>{" "}
            {char.contentCompletion}
          </p>
        )}
        {(char.worldEvents != null || char.lootruns != null || char.caves != null) && (
          <p>
            <span className="text-muted-foreground">Events</span>{" "}
            {[char.worldEvents != null && `World ${char.worldEvents}`, char.lootruns != null && `Loot runs ${char.lootruns}`, char.caves != null && `Caves ${char.caves}`]
              .filter(Boolean)
              .join(" · ")}
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
              .map(([name, p]) => `${name} ${p.level}${p.xpPercent != null ? ` (${p.xpPercent}%)` : ""}`)
              .join(" · ")}
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

export function PlayerFullStatsContent({ fullStats }: { fullStats: PlayerFullStats }) {
  return (
    <div className="space-y-6 overflow-y-auto pb-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MainStatsCards mainStats={fullStats} />
      </div>
      <div>
        <h3 className="mb-3 font-semibold">Characters (full data)</h3>
        <div className="space-y-4">
          {Object.entries(fullStats.characters).map(([uuid, char]) => (
            <CharacterFullCard key={uuid} char={char} />
          ))}
        </div>
      </div>
    </div>
  );
}
