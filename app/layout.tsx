import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
	title: "Fastvid - Speed Up Videos Quickly Online",
	description:
		"Accelerate your lectures, podcasts, and videos without changing the voice pitch. Free, fast, and high-quality video speed changer.",
	keywords: [
		"video speed changer",
		"accelerate video online",
		"speed up lectures",
		"online video tool",
		"fast video processing",
	],
	authors: [{ name: "Fastvid Team" }],
	openGraph: {
		title: "Fastvid - Online Video Speed Changer",
		description:
			"Save hours of time by speeding up your videos without losing audio quality.",
		url: "https://www.fastvid.online",
		siteName: "Fastvid",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Fastvid - Accelerate your videos online",
		description:
			"Speed up your videos 1.1x to 2.0x while preserving natural voice pitch.",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Hardcoded fallback ID from credentials.md to ensure it works even if ENV is missing during build
	const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-YEPD9R2P8T";

	// Debug: Show GA_ID status in console
	if (!GA_ID) {
		console.warn(
			"⚠️  NEXT_PUBLIC_GA_ID is EMPTY — Google Analytics will be DISABLED. Check Railway variables.",
		);
	} else {
		console.log("✅ NEXT_PUBLIC_GA_ID loaded:", GA_ID);
	}

	return (
		<html lang="en" className="dark">
			<head>
				{/* Debug: GA ID status in meta tag for view-source visibility */}
				<meta
					name="ga-debug"
					content={GA_ID ? `GA_ID=${GA_ID}` : "GA_ID=EMPTY"}
				/>
				<GoogleAnalytics GA_MEASUREMENT_ID={GA_ID} />
				{/* Google AdSense — raw script tag for Google crawler visibility */}
				{/* eslint-disable-next-line @next/next/no-sync-scripts */}
				<script
					async
					src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1705879673378260"
					crossOrigin="anonymous"
				/>
			</head>
			<body
				className={`${inter.variable} font-sans antialiased bg-zinc-950 text-zinc-50 min-h-screen selection:bg-indigo-500/30`}
			>
				<div className="relative flex min-h-screen flex-col overflow-hidden">
					{children}
				</div>
			</body>
		</html>
	);
}
