import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "./lib/blog";
import { solutionPages } from "./lib/seo";

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
      url: `${base}/learn-french`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.82
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${base}/legal`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35
    },
    {
      url: `${base}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35
    },
    {
      url: `${base}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35
    },
    {
      url: `${base}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35
    },
    {
      url: `${base}/solutions`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75
    },
    ...solutionPages.map((page) => ({
      url: `${base}/solutions/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.72
    })),
    ...blogPosts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.65
    }))
  ];
}
