"use client";

import { useCallback, useEffect, useState } from "react";
import { getAbilityTree, getAbilityMap } from "@/api/ability";
import { getPlayerCharacterAbilityMap } from "@/api/player";
import { CharacterDetailDialog } from "@/components/character-detail-dialog";
import { CopySwitchButton } from "@/components/copy-switch-button";
import { OnlinePlayersDialog } from "@/components/online-players-dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	formatDateDDMonthYear,
	formatTimeElapsed,
	rankBadgeUrl,
} from "@/lib/utils";
import { wynnClassIconUrl } from "@/lib/wynn-cdn";
import { PlayerSkin } from "@/components/player-skin";
import type {
	PlayerMainStats,
	PlayerFullStats,
	PlayerCharacterData,
} from "@/types/player";
import type { AbilityTreeResponse, AbilityMapEntry } from "@/types/ability";

const FIXED_LOCALE = "en-US";

function flattenMapEntries(
	data: AbilityMapEntry[] | Record<string, AbilityMapEntry[]>,
): AbilityMapEntry[] {
	if (Array.isArray(data)) return data;
	return Object.values(data).flat();
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

export function MainStatsCards({ mainStats }: { mainStats: PlayerMainStats }) {
	const [onlineDialogOpen, setOnlineDialogOpen] = useState(false);
	const [onlineDialogServer, setOnlineDialogServer] = useState<string | null>(
		null,
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
						<CardDescription className="flex gap-2 text-sm font-mono">
							{" "}
							<p className="flex items-center gap-2">
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
							)}
						</CardDescription>
					</CardHeader>
				</Card>
				<div className="flex sm:flex-row flex-col gap-4 w-full">
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
								{mainStats.firstJoin
									? formatDateDDMonthYear(mainStats.firstJoin)
									: "—"}
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
				<div className="flex sm:flex-row flex-col gap-4 w-full">
					<Card className="w-full">
						<CardHeader>
							<CardTitle className="font-sans">Total Mob Kills</CardTitle>
							<CardDescription className="flex gap-2 text-sm font-mono">
								{formatNumber(
									mainStats.featuredStats?.["globalData.mobsKilled"],
								)}
							</CardDescription>
						</CardHeader>
					</Card>
					<Card className="w-full">
						<CardHeader>
							<CardTitle className="font-sans">Total Levels</CardTitle>
							<CardDescription className="flex gap-2 text-sm font-mono">
								{formatNumber(
									mainStats.featuredStats?.["globalData.totalLevel"],
								)}
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
                      src={wynnLeaderboardIconUrl(name.replace(/([A-Z])/g, " $1").split(" ")[0])}
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
						src={wynnClassIconUrl(char.type)}
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
					{char.type}{" "}
					{char.reskin != null && char.reskin !== char.type && (
						<span className="text-muted-foreground font-normal">
							{char.reskin}
						</span>
					)}
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

export function PlayerFullStatsContent({
	fullStats,
}: {
	fullStats: PlayerFullStats;
}) {
	console.log(fullStats);
	const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
	const characterEntries = Object.entries(fullStats.characters ?? {});
	const selectedChar = selectedUuid ? fullStats.characters[selectedUuid] : null;

	const [abilityTree, setAbilityTree] = useState<AbilityTreeResponse | null>(
		null,
	);
	const [abilityFullMap, setAbilityFullMap] = useState<
		AbilityMapEntry[] | null
	>(null);
	const [abilityPlayerMap, setAbilityPlayerMap] = useState<
		AbilityMapEntry[] | null
	>(null);
	const [abilityLoading, setAbilityLoading] = useState(false);
	const [abilityError, setAbilityError] = useState<string | null>(null);

	const loadAbilityMap = useCallback(() => {
		if (!selectedChar || !selectedUuid || !fullStats.username) return;
		const treeClass = selectedChar.type.toLowerCase();
		setAbilityLoading(true);
		setAbilityError(null);
		Promise.allSettled([
			getAbilityTree(treeClass),
			getAbilityMap(treeClass),
			getPlayerCharacterAbilityMap(fullStats.username, selectedUuid),
		])
			.then(([treeRes, fullMapRes, playerMapRes]) => {
				setAbilityTree(treeRes.status === "fulfilled" ? treeRes.value : null);
				setAbilityFullMap(
					fullMapRes.status === "fulfilled"
						? flattenMapEntries(
								fullMapRes.value as
									| AbilityMapEntry[]
									| Record<string, AbilityMapEntry[]>,
							)
						: null,
				);
				setAbilityPlayerMap(
					playerMapRes.status === "fulfilled"
						? (playerMapRes.value as AbilityMapEntry[])
						: null,
				);
				if (
					treeRes.status === "rejected" &&
					fullMapRes.status === "rejected" &&
					playerMapRes.status === "rejected"
				) {
					setAbilityError(
						playerMapRes.reason instanceof Error
							? playerMapRes.reason.message
							: "Failed to load ability map",
					);
				}
			})
			.finally(() => setAbilityLoading(false));
	}, [selectedChar, selectedUuid, fullStats.username]);

	useEffect(() => {
		if (!selectedUuid || !selectedChar) {
			setAbilityTree(null);
			setAbilityFullMap(null);
			setAbilityPlayerMap(null);
			setAbilityError(null);
			return;
		}
		loadAbilityMap();
	}, [loadAbilityMap, selectedUuid, selectedChar]);

	const abilityEntries = (
		abilityFullMap && abilityFullMap.length > 0
			? abilityFullMap
			: (abilityPlayerMap ?? [])
	) as AbilityMapEntry[];
	const playerMapEntries = (abilityPlayerMap ?? []) as AbilityMapEntry[];

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
								{characterEntries.length} character
								{characterEntries.length === 1 ? "" : "s"} · click to view
								details
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

			<CharacterDetailDialog
				open={!!selectedUuid}
				onOpenChange={(open) => !open && setSelectedUuid(null)}
				characterEntries={characterEntries}
				selectedUuid={selectedUuid}
				onSelectCharacter={setSelectedUuid}
				selectedChar={selectedChar}
				abilityLoading={abilityLoading}
				abilityError={abilityError}
				abilityEntries={abilityEntries}
				abilityTree={abilityTree}
				playerMapEntries={playerMapEntries}
			/>
		</div>
	);
}
