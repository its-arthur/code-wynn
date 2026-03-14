import { proxyGet } from "../../proxy";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ path?: string[] }> },
) {
	const { path = [] } = await params;
	return proxyGet(request, "trademarket", path);
}
