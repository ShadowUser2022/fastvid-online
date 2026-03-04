import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: 'standalone',

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
