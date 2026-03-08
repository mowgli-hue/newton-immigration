import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "./lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.junglelabsworld.ca";
  const blogPosts = getAllBlogPosts();

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
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7
    },
    ...blogPosts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.65
    }))
  ];
}
