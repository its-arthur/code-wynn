import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{ hostname: "cdn.wynncraft.com" },
			{ hostname: "mc-heads.net" },
		],
	},
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "Access-Control-Allow-Origin",
						value: "*",
					},
				],
			},
		];
	},
};

export default nextConfig;
