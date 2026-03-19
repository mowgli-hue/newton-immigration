import type { Metadata } from "next";
import "./globals.css";

const metadataBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "http://localhost:3006";

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: "FlowDesk CRM Builder",
  description:
    "Build custom CRM workflows, client portals, and team operations pipelines for any industry."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
