/**
 * Cache-Control values for API routes. Vercel Edge caches responses, reducing
 * serverless invocations and bandwidth on the free tier.
 *
 * s-maxage: CDN cache duration (seconds)
 * stale-while-revalidate: Serve stale while revalidating in background
 */
export const CACHE = {
	/** Player stats: ~90s fresh, 180s stale-while-revalidate */
	player: "public, s-maxage=90, stale-while-revalidate=180",
	/** Item DB, metadata: ~5min fresh */
	item: "public, s-maxage=300, stale-while-revalidate=600",
	/** News, articles, ability tree: ~5–10min */
	static: "public, s-maxage=300, stale-while-revalidate=600",
	/** Market data: ~90s */
	market: "public, s-maxage=90, stale-while-revalidate=180",
} as const;

export function jsonWithCache(data: unknown, cacheControl: string): Response {
	return new Response(JSON.stringify(data), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": cacheControl,
		},
	});
}
