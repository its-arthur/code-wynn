import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import {
	GeistPixelCircle,
	GeistPixelGrid,
	GeistPixelLine,
	GeistPixelSquare,
	GeistPixelTriangle,
} from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";
import { DisableZoomHandler } from "@/components/disable-zoom-handler";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
	title: "Code Wynn",
	description: "Next.js with Tailwind, shadcn/ui and Zustand",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`dark ${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelCircle.variable} ${GeistPixelTriangle.variable} ${GeistPixelLine.variable}`}
		>
			<body
				className="antialiased bg-background text-foreground font-sans select-none touch-manipulation"
				suppressHydrationWarning
			>
				<DisableZoomHandler />
				<Navbar />
				{children}
				<Toaster position="bottom-right" />
			</body>
		</html>
	);
}
