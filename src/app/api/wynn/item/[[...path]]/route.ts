/**
 * Proxy for Wynncraft Item API. Forwards GET/POST to api.wynncraft.com/v3/item
 * so the frontend can avoid CORS. API key is sent server-side only (WYNN_API_KEY).
 */
const UPSTREAM = "https://api.wynncraft.com/v3/item";

function buildUpstreamUrl(request: Request, path: string[]) {
	const pathSegment = path.length
		? `/${path.map(encodeURIComponent).join("/")}`
		: "";
	const url = new URL(request.url);
	const qs = url.searchParams.toString();
	return `${UPSTREAM}${pathSegment}${qs ? `?${qs}` : ""}`;
}

function getHeaders() {
	const apiKey =
		process.env.WYNN_API_KEY ?? process.env.NEXT_PUBLIC_WYNN_API_KEY;
	return {
		Accept: "application/json",
		...(apiKey && { Authorization: `Bearer ${apiKey}` }),
	};
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ path?: string[] }> },
) {
	const { path = [] } = await params;
	const upstreamUrl = buildUpstreamUrl(request, path);

	const res = await fetch(upstreamUrl, { headers: getHeaders() });

	if (!res.ok) {
		const text = await res.text();
		return new Response(text || res.statusText, { status: res.status });
	}

	const data = await res.json();
	return Response.json(data);
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ path?: string[] }> },
) {
	const { path = [] } = await params;
	const upstreamUrl = buildUpstreamUrl(request, path);
	const body = await request.text();

	const res = await fetch(upstreamUrl, {
		method: "POST",
		headers: { ...getHeaders(), "Content-Type": "application/json" },
		body,
	});

	if (!res.ok) {
		const text = await res.text();
		return new Response(text || res.statusText, { status: res.status });
	}

	const data = await res.json();
	return Response.json(data);
}
