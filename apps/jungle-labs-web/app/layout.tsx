import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { AnalyticsProvider } from "./components/AnalyticsProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.junglelabsworld.ca"),
  title: {
    default: "Jungle Labs | Intelligent Digital Systems",
    template: "%s | Jungle Labs"
  },
  description:
    "Jungle Labs builds AI automation systems, software platforms, analytics infrastructure, and digital ecosystems for modern businesses.",
  keywords: [
    "Jungle Labs",
    "AI automation",
    "custom CRM",
    "analytics dashboards",
    "software development",
    "business intelligence"
  ],
  applicationName: "Jungle Labs",
  authors: [{ name: "Jungle Labs" }],
  creator: "Jungle Labs",
  publisher: "Jungle Labs",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Jungle Labs | Intelligent Digital Systems",
    description:
      "Building intelligent digital systems for modern businesses: AI automation, custom platforms, and analytics infrastructure.",
    siteName: "Jungle Labs",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Jungle Labs" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Jungle Labs | Intelligent Digital Systems",
    description: "AI automation systems, custom software, and analytics platforms for growth-focused teams.",
    images: ["/twitter-image"]
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        {children}
        <AnalyticsProvider />
      </body>
    </html>
  );
}
