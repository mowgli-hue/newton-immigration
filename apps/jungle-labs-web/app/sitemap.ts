import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.junglelabsworld.ca";

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${base}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    }
  ];
}
