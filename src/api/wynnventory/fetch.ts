/**
 * Shared fetch helper for Wynnventory API clients.
 * In the browser requests go through the local proxy; on the server they hit the upstream directly.
 */

const PROXY_BASE = "/api/wynnventory";
const UPSTREAM_BASE = "https://www.wynnventory.com/api";

export function base(module: string) {
	return typeof window !== "undefined"
		? `${PROXY_BASE}/${module}`
		: `${UPSTREAM_BASE}/${module}`;
}

export async function fetchJson<T>(
	url: string,
	init?: RequestInit,
): Promise<T> {
	const apiKey = process.env.WYNNVENTORY_API_KEY;
	const res = await fetch(url, {
		...init,
		headers: {
			Accept: "application/json",
			...(apiKey &&
				url.startsWith("http") && { Authorization: `Api-Key ${apiKey}` }),
			...init?.headers,
		},
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(
			`Wynnventory API ${res.status}: ${text || res.statusText}`,
		);
	}
	return res.json() as Promise<T>;
}

export function toQueryString(
	params: Record<string, string | number | boolean | null | undefined>,
): string {
	const entries = Object.entries(params).filter(
		([, v]) => v !== undefined && v !== null,
	);
	if (entries.length === 0) return "";
	const sp = new URLSearchParams();
	for (const [k, v] of entries) sp.set(k, String(v));
	return `?${sp.toString()}`;
}
