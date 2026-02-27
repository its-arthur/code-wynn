/**
 * Wynncraft online player list API
 * GET .../player?identifier=<uuid/username>&server=<WC1/1, WC2/2, ...>
 * 30 seconds TTL
 * @see https://docs.wynncraft.com/docs/modules/player.html
 */

import type { OnlinePlayerList } from "@/types/player";

const BASE = "https://api.wynncraft.com/v3/player";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wynncraft API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface GetOnlinePlayerListParams {
  /** Username or UUID to filter by (optional). */
  identifier?: string;
  /** Server name or id: WC1, 1, WC2, 2, WC43, etc. (optional). */
  server?: string | number;
}

/**
 * GET Online player list (30 sec TTL).
 * Returns onlinePlayers count and a map of player name → server (e.g. "WC1").
 * If the API omits onlinePlayers, the count is derived from the players object.
 */
export async function getOnlinePlayerList(
  params: GetOnlinePlayerListParams = {}
): Promise<OnlinePlayerList> {
  const search = new URLSearchParams();
  if (params.identifier != null && params.identifier !== "") {
    search.set("identifier", params.identifier);
  }
  if (params.server != null && params.server !== "") {
    search.set("server", String(params.server));
  }
  const qs = search.toString();
  const url = qs ? `${BASE}?${qs}` : BASE;
  const data = await fetchJson<OnlinePlayerList>(url);
  const players = data.players ?? {};
  const count =
    data.onlinePlayers != null
      ? data.onlinePlayers
      : Object.keys(players).length;
  return { ...data, players, onlinePlayers: count };
}
