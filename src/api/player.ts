/**
 * Wynncraft Player API client
 * Base: https://api.wynncraft.com/v3/player
 * @see https://docs.wynncraft.com/docs/modules/player.html
 */

import type {
  PlayerMainStats,
  PlayerMainStatsResponse,
  PlayerFullStats,
  PlayerCharacterListItem,
  PlayerCharacterData,
  PlayerCharacterAbilityMap,
  PlayerWhoami,
  OnlinePlayerList,
} from "@/types/player";

/** Use same-origin proxy in browser to avoid CORS; call Wynncraft directly on server. */
const BASE =
  typeof window !== "undefined"
    ? "/api/wynn/player"
    : "https://api.wynncraft.com/v3/player";

function isMultiSelector(
  data: PlayerMainStatsResponse
): data is Record<string, { storedName: string; rank: string }> {
  if (!data || typeof data !== "object") return false;
  const first = Object.values(data)[0];
  return (
    first != null &&
    typeof first === "object" &&
    "storedName" in first &&
    "rank" in first &&
    !("username" in first)
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.WYNN_API_KEY ?? process.env.NEXT_PUBLIC_WYNN_API_KEY;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(apiKey && url.startsWith("http") && {
        Authorization: `Bearer ${apiKey}`,
      }),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wynncraft API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * GET Player main stats (2 min TTL)
 * @param identifier - username or UUID
 */
export async function getPlayerMainStats(
  identifier: string
): Promise<PlayerMainStatsResponse> {
  const url = `${BASE}/${encodeURIComponent(identifier)}`;
  return fetchJson<PlayerMainStatsResponse>(url);
}

/**
 * GET Player full stats including characters (2 min TTL)
 * @param identifier - username or UUID
 */
export async function getPlayerFullStats(
  identifier: string
): Promise<PlayerFullStats> {
  const url = `${BASE}/${encodeURIComponent(identifier)}?fullResult`;
  return fetchJson<PlayerFullStats>(url);
}

/**
 * GET Player character list (2 min TTL)
 * @param identifier - username or UUID
 */
export async function getPlayerCharacterList(
  identifier: string
): Promise<Record<string, PlayerCharacterListItem>> {
  const url = `${BASE}/${encodeURIComponent(identifier)}/characters`;
  return fetchJson<Record<string, PlayerCharacterListItem>>(url);
}

/**
 * GET Player character data for one character (2 min TTL)
 * @param identifier - username or UUID
 * @param characterUuid - character UUID
 */
export async function getPlayerCharacterData(
  identifier: string,
  characterUuid: string
): Promise<PlayerCharacterData> {
  const url = `${BASE}/${encodeURIComponent(identifier)}/characters/${encodeURIComponent(characterUuid)}`;
  return fetchJson<PlayerCharacterData>(url);
}

/**
 * GET Player character ability map (10 min TTL)
 * Returns 403 if profile/ability tree is hidden.
 * @param identifier - username or UUID
 * @param characterUuid - character UUID
 */
export async function getPlayerCharacterAbilityMap(
  identifier: string,
  characterUuid: string
): Promise<PlayerCharacterAbilityMap> {
  const url = `${BASE}/${encodeURIComponent(identifier)}/characters/${encodeURIComponent(characterUuid)}/abilities`;
  return fetchJson<PlayerCharacterAbilityMap>(url);
}

/**
 * GET Player whoami (0 TTL, requires auth cookies)
 * Returns accounts that have joined Wynncraft.
 */
export async function getPlayerWhoami(): Promise<PlayerWhoami> {
  const url = `${BASE}/whoami`;
  return fetchJson<PlayerWhoami>(url);
}

/**
 * GET Online player list (30 sec TTL)
 * Path may be /v3/network/onlinePlayers depending on API version.
 */
export async function getOnlinePlayerList(): Promise<OnlinePlayerList> {
  const url = `${BASE}/online`;
  return fetchJson<OnlinePlayerList>(url);
}

/** Helper: assert main stats (not multi-selector) */
export function assertPlayerMainStats(
  data: PlayerMainStatsResponse
): asserts data is PlayerMainStats {
  if (isMultiSelector(data)) {
    throw new Error(
      "Multiple players match this name; use UUID or select one from the multi-selector response."
    );
  }
}
