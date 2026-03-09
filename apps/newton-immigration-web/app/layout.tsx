import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/footer";

export const metadata: Metadata = {
  title: "Newton Immigration | Canada Immigration Consultants",
  description:
    "Expert guidance for Express Entry, work permits, and PR pathways with tools to calculate your CRS score and explore immigration options."
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
