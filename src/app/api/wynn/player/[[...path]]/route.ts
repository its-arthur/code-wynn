/**
 * Proxy for Wynncraft Player API. Forwards GET to api.wynncraft.com/v3/player
 * so the frontend can avoid CORS. API key is sent server-side only (WYNN_API_KEY).
 */
import { CACHE, jsonWithCache } from "@/lib/api-cache";

const UPSTREAM = "https://api.wynncraft.com/v3/player";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  const pathSegment = path.length ? `/${path.map(encodeURIComponent).join("/")}` : "";
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const upstreamUrl = `${UPSTREAM}${pathSegment}${qs ? `?${qs}` : ""}`;

  const apiKey = process.env.WYNN_API_KEY ?? process.env.NEXT_PUBLIC_WYNN_API_KEY;
  const res = await fetch(upstreamUrl, {
    headers: {
      Accept: "application/json",
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(text || res.statusText, { status: res.status });
  }

  const data = await res.json();
  return jsonWithCache(data, CACHE.player);
}
