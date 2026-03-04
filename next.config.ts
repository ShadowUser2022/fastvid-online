import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: 'standalone',

	async redirects() {
		return [
			{
				source: '/:path*',
				has: [
					{
						type: 'host',
						value: 'fastvid.online',
					},
				],
				destination: 'https://www.fastvid.online/:path*',
				permanent: true,
			},
		];
	},

	async headers() {
		return [
			{
				source: '/ads.txt',
				headers: [
					{ key: 'Content-Type', value: 'text/plain' },
				],
			},
		];
	},
};

export default nextConfig;
