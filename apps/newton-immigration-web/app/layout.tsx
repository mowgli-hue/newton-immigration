import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004"),
  title: "Newton Immigration | Canada Immigration Consultants",
  description:
    "Expert guidance for Express Entry, work permits, and PR pathways with tools to calculate your CRS score and explore immigration options.",
  keywords: [
    "Newton Immigration",
    "Canada immigration consultant",
    "Express Entry",
    "CRS calculator",
    "PNP",
    "work permits",
    "study permits"
  ],
  openGraph: {
    title: "Newton Immigration | Canada Immigration Consultants",
    description:
      "Expert guidance for Express Entry, work permits, and PR pathways with tools to calculate your CRS score and explore immigration options.",
    type: "website",
    siteName: "Newton Immigration"
  },
  twitter: {
    card: "summary_large_image",
    title: "Newton Immigration | Canada Immigration Consultants",
    description:
      "Expert guidance for Express Entry, work permits, and PR pathways with tools to calculate your CRS score and explore immigration options."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
