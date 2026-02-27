/**
 * Player module types from Wynncraft API v3
 * @see https://docs.wynncraft.com/docs/modules/player.html
 */

export interface LegacyRankColour {
  main: string;
  sub: string;
}

export interface PlayerGuild {
  name: string;
  prefix: string;
  rank: string;
  rankStars: string;
}

export interface DungeonsData {
  total: number;
  list: Record<string, number>;
}

export interface RaidsData {
  total: number;
  list: Record<string, number>;
}

export interface PvpData {
  kills: number | null;
  deaths: number | null;
}

export interface GuildRaidsData {
  total: number;
  list: Record<string, number>;
}

export interface GlobalData {
  wars: number;
  /** @deprecated use totalLevel */
  totalLevels?: number;
  totalLevel?: number;
  /** @deprecated use mobsKilled */
  killedMobs?: number;
  mobsKilled?: number;
  chestsFound: number;
  dungeons: DungeonsData;
  raids: RaidsData;
  completedQuests: number;
  pvp: PvpData;
  contentCompletion?: number;
  worldEvents?: number;
  lootruns?: number;
  caves?: number;
  guildRaids?: GuildRaidsData;
}

/** Player main stats - GET .../ 2 min TTL */
export interface PlayerMainStats {
  username: string;
  online: boolean;
  server: string;
  activeCharacter: string | null;
  nickname: string | null;
  uuid: string;
  rank: string;
  rankBadge: string;
  legacyRankColour: LegacyRankColour;
  shortenedRank: string | null;
  supportRank: string | null;
  veteran: boolean | null;
  firstJoin: string;
  lastJoin: string;
  playtime: number;
  guild: PlayerGuild | null;
  globalData: GlobalData;
  forumLink?: number | null;
  ranking: Record<string, number>;
  previousRanking: Record<string, number>;
  publicProfile?: boolean;
  featuredStats?: {
    firstJoin?: string;
    playtime?: number;
    "globalData.totalLevel"?: number;
    "globalData.mobsKilled"?: number;
    "globalData.completedQuests"?: number;
  };
  wallpaper?: string;
  avatar?: string;
  restrictions?: {
    mainAccess?: boolean;
    characterDataAccess?: boolean;
    characterBuildAccess?: boolean;
    onlineStatus?: boolean;
  };
}

/** Player full stats = main + characters (use ?fullResult) */
export interface PlayerFullStats extends PlayerMainStats {
  characters: Record<string, PlayerCharacterData>;
}

export interface SkillPoints {
  strength?: number;
  dexterity?: number;
  intelligence?: number;
  /** UK spelling - API may use defense */
  defence?: number;
  defense?: number;
  agility?: number;
}

export interface ProfessionLevel {
  level: number;
  xpPercent: number;
}

export interface Professions {
  fishing: ProfessionLevel;
  mining: ProfessionLevel;
  [key: string]: ProfessionLevel;
}

/** Character list item (summary) */
export interface PlayerCharacterListItem {
  type: string;
  nickname: string;
  level: number;
  xp: number;
  xpPercent: number;
  totalLevel: number;
  gamemode: string[];
  meta?: {
    died: boolean;
  };
}

/** Full character data */
export interface PlayerCharacterData extends PlayerCharacterListItem {
  wars?: number;
  playtime?: number;
  mobsKilled?: number;
  chestsFound?: number;
  blocksWalked?: number;
  itemsIdentified?: number | null;
  logins?: number;
  deaths?: number;
  discoveries?: number;
  pvp?: PvpData;
  skillPoints?: SkillPoints;
  professions?: Professions;
  dungeons?: DungeonsData | null;
  raids?: RaidsData | null;
  quests?: string[];
  reskin?: string | null;
  preEconomy?: boolean | null;
  contentCompletion?: number;
  worldEvents?: number;
  lootruns?: number;
  caves?: number;
  removedStat?: unknown[];
}

/** Ability map item - ability node */
export interface AbilityMapAbility {
  type: "ability";
  coordinates: { x: number; y: number };
  meta: {
    icon: {
      value: { id: string; name: string; customModelData: string } | string;
      format: string;
    };
    page: number;
    id: string;
  };
  family: string[];
}

/** Ability map item - connector */
export interface AbilityMapConnector {
  type: "connector";
  coordinates: { x: number; y: number };
  meta: {
    icon: string;
    page: number;
  };
  family: string[];
}

export type PlayerCharacterAbilityMapItem = AbilityMapAbility | AbilityMapConnector;

/** Player character ability map - GET .../ 10 min TTL */
export type PlayerCharacterAbilityMap = PlayerCharacterAbilityMapItem[];

/** Whoami entry (one account) */
export interface WhoamiEntry {
  username: string;
  online: boolean;
  nickname: string | null;
  rank: string;
  veteran: boolean | null;
  rankBadge: string | null;
  supportRank: string | null;
  shortenedRank: string | null;
  legacyRankColour: LegacyRankColour | null;
}

/** Player whoami - GET .../ 0 TTL (auth) */
export type PlayerWhoami = Record<string, WhoamiEntry>;

/** Online player list - GET .../ 30 sec TTL. API may omit onlinePlayers; use count from players when null. */
export interface OnlinePlayerList {
  onlinePlayers?: number | null;
  players: Record<string, string>;
}

/** Multi-selector when multiple names match (edge case) */
export interface PlayerMultiSelector {
  [uuid: string]: {
    storedName: string;
    rank: string;
  };
}

export type PlayerMainStatsResponse = PlayerMainStats | PlayerMultiSelector;
