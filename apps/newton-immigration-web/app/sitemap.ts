import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";
  const routes = [
    "",
    "/programs",
    "/crs-calculator",
    "/immigration-news",
    "/blog",
    "/about",
    "/contact",
    "/assessment",
    "/consultation",
    "/ai-advisor",
    "/pr-strategy-report"
  ];

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/immigration-news" ? "hourly" : "weekly",
    priority: route === "" ? 1 : 0.7
  }));
}
