/**
 * Shared proxy logic for Wynnventory API routes.
 * Auth: Api-Key header from WYNNVENTORY_API_KEY env var.
 */
import { CACHE, jsonWithCache } from "@/lib/api-cache";

const UPSTREAM_BASE = "https://www.wynnventory.com/api";

export function buildUpstreamUrl(
	request: Request,
	module: string,
	path: string[],
) {
	const pathSegment = path.length
		? `/${path.map(encodeURIComponent).join("/")}`
		: "";
	const url = new URL(request.url);
	const qs = url.searchParams.toString();
	return `${UPSTREAM_BASE}/${module}${pathSegment}${qs ? `?${qs}` : ""}`;
}

export function getHeaders() {
	const apiKey = process.env.WYNNVENTORY_API_KEY;
	return {
		Accept: "application/json",
		...(apiKey && { Authorization: `Api-Key ${apiKey}` }),
	};
}

export async function proxyGet(
	request: Request,
	module: string,
	path: string[],
) {
	const upstreamUrl = buildUpstreamUrl(request, module, path);
	const res = await fetch(upstreamUrl, { headers: getHeaders() });

	if (!res.ok) {
		const text = await res.text();
		return new Response(text || res.statusText, { status: res.status });
	}

	const data = await res.json();
	return jsonWithCache(data, CACHE.market);
}
