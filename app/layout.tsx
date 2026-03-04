import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Fastvid - Speed up videos quickly online",
  description: "Accelerate your lectures, podcasts, and videos without changing the voice pitch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-zinc-950 text-zinc-50 min-h-screen selection:bg-indigo-500/30`}>
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
