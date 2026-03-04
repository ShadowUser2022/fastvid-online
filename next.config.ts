import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: 'standalone',

	async redirects() {
		return [
			// www → non-www canonical redirect
			{
				source: '/:path*',
				has: [{ type: 'host', value: 'www.fastvid.online' }],
				destination: 'https://fastvid.online/:path*',
				permanent: true,
			},
		];
	},

	async headers() {
		return [
			{
				// Allow AdSense/crawlers to access ads.txt freely
				source: '/ads.txt',
				headers: [
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Content-Type', value: 'text/plain' },
					{ key: 'Cache-Control', value: 'public, max-age=86400' },
				],
			},
		];
	},
};

export default nextConfig;
