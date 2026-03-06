"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AbilityMapGrid } from "@/components/ability-map-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDownIcon } from "lucide-react";
import type { PlayerCharacterData, SkillPoints } from "@/types/player";
import { wynnClassIconUrl, wynnClassPictureUrl, wynnDungeonIconUrl, wynnLeaderboardIconUrl, wynnRaidIconUrl, wynnSkillIconUrl } from "@/lib/wynn-cdn";
import type { AbilityTreeResponse, AbilityMapEntry } from "@/types/ability";

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

const SKILL_ENTRIES: {
  key: keyof SkillPoints;
  label: string;
  iconName: string;
  textClass: string;
}[] = [
    { key: "strength", label: "STR", iconName: "strength_book.svg", textClass: "text-green-600 dark:text-green-400" },
    { key: "dexterity", label: "DEX", iconName: "dexterity_book.svg", textClass: "text-yellow-600 dark:text-yellow-400" },
    { key: "intelligence", label: "INT", iconName: "intelligence_book.svg", textClass: "text-blue-600 dark:text-blue-400" },
    { key: "defense", label: "DEF", iconName: "defense_book.svg", textClass: "text-red-600 dark:text-red-400" },
    { key: "agility", label: "AGI", iconName: "agility_book.svg", textClass: "text-neutral-700 dark:text-neutral-300" },
  ];

function CharacterFullCard({ char }: { char: PlayerCharacterData }) {
  const hasSkills =
    char.skillPoints && Object.keys(char.skillPoints).length > 0;
  const hasProfessions =
    char.professions && Object.keys(char.professions).length > 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 border-b border-border/60 pb-3">
        <div className="h-8 w-1 rounded-full bg-primary/70" />
        <div>
          <h3 className="font-sans">Professions</h3>
          <p className="text-xs text-muted-foreground font-mono">
            Overview of the character&apos;s profession levels.
          </p>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3">
        {Object.entries(char.professions ?? {}).map(([name, p]) => (
          <Card key={name} className="min-w-0 h-fit ">
            <CardContent className="gap-4 flex flex-col px-4 py-3">
              <div className="w-full items-center gap-2 grid grid-cols-[30%_70%]">
                <img
                  src={wynnLeaderboardIconUrl(name)}
                  alt={name}
                  className="h-10 w-10 shrink-0 object-contain"
                />
                <div className="flex text-xs min-w-0 flex-col justify-center gap-0.5">
                  <span className=" font-medium text-muted-foreground capitalize font-minecraft truncate" title={name}>{name}</span>
                  <span className="font-mono tabular-nums">
                    LEVEL {p.level}
                  </span>
                </div>
              </div>

              {p.xpPercent != null && (
                <Progress value={p.xpPercent} className="h-1.5" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export interface CharacterDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** List of [uuid, character] for the current player (used for the class dropdown) */
  characterEntries: [string, PlayerCharacterData][];
  selectedUuid: string | null;
  onSelectCharacter: (uuid: string) => void;
  selectedChar: PlayerCharacterData | null;
  abilityLoading: boolean;
  abilityError: string | null;
  abilityEntries: AbilityMapEntry[];
  abilityTree: AbilityTreeResponse | null;
  playerMapEntries: AbilityMapEntry[];
}

export function CharacterDetailDialog({
  open,
  onOpenChange,
  characterEntries,
  selectedUuid,
  onSelectCharacter,
  selectedChar,
  abilityLoading,
  abilityError,
  abilityEntries,
  abilityTree,
  playerMapEntries,
}: CharacterDetailDialogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  const checkScrollBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, clientHeight, scrollHeight } = el;
    const atBottom = scrollHeight - scrollTop - clientHeight < 24;
    setIsScrolledToBottom(atBottom);
  }, []);

  useEffect(() => {
    if (!open || !selectedChar) return;
    console.log(selectedChar);
    const t = setTimeout(checkScrollBottom, 100);
    return () => clearTimeout(t);
  }, [open, selectedChar, abilityEntries.length, checkScrollBottom]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="max-h-[90vh] w-full sm:max-w-7xl overflow-hidden flex flex-col border-2 border-border/80 shadow-xl">
        <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 pb-4">
          <div className="min-w-0 flex-1 space-y-1">
            <DialogTitle className="text-lg">Character</DialogTitle>
            {characterEntries.length > 0 && (
              <Select
                value={selectedUuid ?? ""}
                onValueChange={(value) => value && onSelectCharacter(value)}
              >
                <SelectTrigger className="min-h-14 w-full max-w-sm items-start gap-3 py-2 pl-2.5 pr-3 text-left">
                  {selectedChar && !selectedUuid ? (
                    <>
                      <img
                        src={wynnClassIconUrl(selectedChar.type)}
                        alt=""
                        className="size-10 shrink-0 object-contain"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="leading-tight">
                          {selectedChar.type}
                          {selectedChar.reskin != null && selectedChar.reskin !== selectedChar.type && (
                            <span className="text-muted-foreground font-normal"> {selectedChar.reskin}</span>
                          )}
                          {selectedChar.nickname && (
                            <span className="text-muted-foreground font-normal"> · {selectedChar.nickname}</span>
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground leading-tight">
                          Lv {selectedChar.level}
                          {selectedChar.playtime != null && ` · ${formatPlaytime(selectedChar.playtime)} playtime`}
                        </span>
                      </div>
                      <SelectValue placeholder="Select character" className="sr-only" />
                    </>
                  ) : (
                    <SelectValue placeholder="Select character" />
                  )}
                </SelectTrigger>
                <SelectContent className="z-100" position="popper">
                  {characterEntries.map(([uuid, char]) => (
                    <SelectItem key={uuid} value={uuid} className="items-start gap-3 py-2">
                      <img
                        src={wynnClassIconUrl(char.type)}
                        alt=""
                        className="size-8 shrink-0 object-contain"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="leading-tight">
                          {char.type}
                          {char.reskin != null && char.reskin !== char.type && (
                            <span className="text-muted-foreground font-normal"> {char.reskin}</span>
                          )}
                          {char.nickname && (
                            <span className="text-muted-foreground font-normal"> · {char.nickname}</span>
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground leading-tight">
                          Lv {char.level}
                          {char.playtime != null && ` · ${formatPlaytime(char.playtime)} playtime`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </DialogHeader>
        <div
          ref={scrollRef}
          className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6 pt-4 space-y-6"
          onScroll={checkScrollBottom}
        >
          {selectedChar && (
            <>
              <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch">
                <div className="flex w-full shrink-0 flex-col lg:min-w-0 lg:max-w-md">
                <div className="mb-4 flex w-full shrink-0 flex-col items-center gap-1">
                    <div className="flex justify-between w-full">
                    <span className="leading-tight">
                          {selectedChar.type}
                          {selectedChar.reskin != null && selectedChar.reskin !== selectedChar.type && (
                            <span className="text-muted-foreground font-normal"> {selectedChar.reskin}</span>
                          )}
                          {selectedChar.nickname && (
                            <span className="text-muted-foreground font-normal"> · {selectedChar.nickname}</span>
                          )}
                        </span>
                        <span className="text-sm font-mono text-white leading-tight">
                      Lv. {selectedChar.level}
                    </span>
                    </div>
                  
                    {selectedChar.xpPercent != null && (
                      <div className="flex w-full items-center gap-2">
                        <Progress value={selectedChar.xpPercent} className="h-1.5 flex-1 min-w-0" />
                        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                          {selectedChar.xpPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="relative flex min-h-0 flex-1 p-4 overflow-hidden rounded-xl bg-muted/20 ring-1 ring-border/50 transition-all duration-200 group-hover:ring-primary/40">
                    <img
                      src={wynnClassPictureUrl(selectedChar.type)}
                      alt={selectedChar.type}
                      className="size-full object-contain object-center transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                </div>
                <div className="min-w-0 w-full flex-1">{selectedChar && <CharacterFullCard char={selectedChar} />}</div>
              </div>

              <section>
                  <Collapsible defaultOpen={false} className="group">
                    <CollapsibleTrigger className="flex w-full items-center gap-3 border-b border-border/60 pb-3 mb-4 text-left hover:opacity-90">
                      <div className="h-8 w-1 rounded-full bg-primary/70" />
                      <div className="flex-1">
                        <h3 className="font-sans">Quests</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          Overview of the character&apos;s completed quests.
                        </p>
                      </div>
                      <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {!selectedChar.quests?.length ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No quests data found.
                        </p>
                      ) : (
                        <ul className="flex flex-wrap gap-2">
                          {[...selectedChar.quests].sort((a, b) => a.localeCompare(b)).map((name) => (
                            <li key={name}>
                              <span className="inline-block rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 text-sm">
                                {name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </section>

                <section>
                  <Collapsible defaultOpen className="group">
                    <CollapsibleTrigger className="flex w-full items-center gap-3 border-b border-border/60 pb-3 mb-4 text-left hover:opacity-90">
                      <div className="h-8 w-1 rounded-full bg-primary/70" />
                      <div className="flex-1">
                        <h3 className="font-sans">Dungeons</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          Overview of the character&apos;s dungeons.
                        </p>
                      </div>
                      <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {Object.keys(selectedChar.dungeons?.list ?? {}).length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No dungeons data found.
                        </p>
                      ) : (
                        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
                          {Object.entries(selectedChar.dungeons?.list ?? {}).map(([name, count]) => (
                            <Card key={name} className="min-w-0">
                              <CardContent className="grid grid-cols-[30%_70%] gap-x-3 gap-y-1 px-4 py-3">
                                <img
                                  src={wynnDungeonIconUrl(name)}
                                  alt={name}
                                  className="h-full w-full shrink-0 object-contain"
                                />
                                <div className="flex min-w-0 flex-col justify-center gap-0.5">
                                  <span className="text-xs font-medium text-muted-foreground font-minecraft truncate" title={name}>
                                    {name}
                                  </span>
                                  <span className="text-lg font-mono tabular-nums items-baseline">
                                    {count} <span className="text-xs font-medium uppercase ">{count > 1 ? "runs" : "run"}</span>
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </section>

                <section>
                  <Collapsible defaultOpen className="group">
                    <CollapsibleTrigger className="flex w-full items-center gap-3 border-b border-border/60 pb-3 mb-4 text-left hover:opacity-90">
                      <div className="h-8 w-1 rounded-full bg-primary/70" />
                      <div className="flex-1">
                        <h3 className="font-sans">Raids</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          Overview of the character&apos;s raids.
                        </p>
                      </div>
                      <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {Object.keys(selectedChar.raids?.list ?? {}).length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No raids data found.
                        </p>
                      ) : (
                        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
                          {Object.entries(selectedChar.raids?.list ?? {}).map(([name, count]) => (
                            <Card key={name} className="min-w-0">
                              <CardContent className="grid grid-cols-[30%_70%] gap-x-3 gap-y-1 px-4 py-3">
                                <img
                                  src={wynnRaidIconUrl(name)}
                                  alt={name}
                                  className="h-full w-full shrink-0 object-contain"
                                />
                                <div className="flex min-w-0 flex-col justify-center gap-0.5">
                                  <span className="text-xs font-medium text-muted-foreground font-minecraft truncate" title={name}>
                                    {name}
                                  </span>
                                  <span className="text-lg font-mono tabular-nums items-baseline">
                                    {count} <span className="text-xs font-medium uppercase">{count > 1 ? "runs" : "run"}</span>
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </section>


                <section>
              <div className="flex items-center gap-3 border-b border-border/60 pb-3 mb-4">
                <div className="h-8 w-1 rounded-full bg-primary/70" />
                <div>
                  <h3 className="font-sans">Skills</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Overview of the character's skillpoints.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-wrap gap-4 overflow-x-auto">
                {SKILL_ENTRIES.map((e) => (
                  <Card key={e.key} className={`min-w-20 flex-1 shrink-0`}>
                    <CardContent className="flex flex-col items-center gap-2 p-4">
                      <img
                        src={wynnSkillIconUrl(e.iconName)}
                        alt={e.label}
                        className="h-14 w-14 shrink-0 object-contain"
                      />
                      <span className={`text-xs font-medium text-muted-foreground capitalize font-minecraft ${e.textClass}`}>{e.label}</span>
                      <span className={`text-2xl font-pixel-square tabular-nums`}>
                        {selectedChar.skillPoints?.[e.key] ?? 0}
                      </span>
                      <span className={`text-xs font-medium text-muted-foreground capitalize font-minecraft ${e.textClass}`}>{e.key}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
                </section>
              <section>
                <div className="flex items-center gap-3 border-b border-border/60 pb-3 mb-4">
                  <div className="h-8 w-1 rounded-full bg-primary/70" />
                  <div>
                    <h3 className="font-sans">Ability map</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      Overview of the character's ability map.
                    </p>
                  </div>
                </div>
                {abilityLoading && (
                  <Skeleton className="h-[50vh] w-full rounded-lg" />
                )}
                {abilityError && !abilityLoading && (
                  <p className="text-sm text-destructive">{abilityError}</p>
                )}
                {!abilityLoading && abilityEntries.length > 0 && (
                  <AbilityMapGrid
                    entries={abilityEntries}
                    tree={abilityTree}
                    playerMapEntries={playerMapEntries}
                    maxHeight="50vh"
                    showAbilityPopover
                  />
                )}
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
