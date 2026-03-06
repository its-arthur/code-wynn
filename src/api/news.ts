/**
 * Wynncraft News API client (e.g. latest-news).
 * Uses same-origin proxy in browser to avoid CORS.
 */

import type { NewsItem } from "@/types/news";

const BASE =
  typeof window !== "undefined"
    ? "/api/wynn/news"
    : "https://api.wynncraft.com/v3/news";

export async function getLatestNews(): Promise<NewsItem[]> {
  const url = `${BASE}/latest-news`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`News API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
