'use client';

import { useEffect } from 'react';

interface AdSenseAdProps {
	adSlot?: string;
	adFormat?: string;
	fullWidthResponsive?: boolean;
}

export default function AdSenseAd({
	adSlot = "",
	adFormat = "auto",
	fullWidthResponsive = true,
}: AdSenseAdProps) {
	useEffect(() => {
		try {
			// @ts-ignore
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch (e) {
			console.error("AdSense error:", e);
		}
	}, []);

	if (!adSlot) {
		// Auto Ads — no slot needed, AdSense places ads automatically
		return null;
	}

	return (
		<div className="w-full my-6 flex justify-center">
			<ins
				className="adsbygoogle"
				style={{ display: "block" }}
				data-ad-client="ca-pub-1705879673378260"
				data-ad-slot={adSlot}
				data-ad-format={adFormat}
				data-full-width-responsive={fullWidthResponsive.toString()}
			/>
		</div>
	);
}
