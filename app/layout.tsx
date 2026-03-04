import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
	title: "Fastvid - Speed Up Videos Quickly Online",
	description: "Accelerate your lectures, podcasts, and videos without changing the voice pitch. Free, fast, and high-quality video speed changer.",
	keywords: ["video speed changer", "accelerate video online", "speed up lectures", "online video tool", "fast video processing"],
	authors: [{ name: "Fastvid Team" }],
	openGraph: {
		title: "Fastvid - Online Video Speed Changer",
		description: "Save hours of time by speeding up your videos without losing audio quality.",
		url: "https://www.fastvid.online",
		siteName: "Fastvid",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Fastvid - Accelerate your videos online",
		description: "Speed up your videos 1.1x to 2.0x while preserving natural voice pitch.",
	},
	robots: {
		index: true,
		follow: true,
	}
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

	return (
		<html lang="en" className="dark">
			<head>
				<GoogleAnalytics GA_MEASUREMENT_ID={GA_ID} />
			</head>
			<body className={`${inter.variable} font-sans antialiased bg-zinc-950 text-zinc-50 min-h-screen selection:bg-indigo-500/30`}>
				<div className="relative flex min-h-screen flex-col overflow-hidden">
					{children}
				</div>
			</body>
		</html>
	);
}
