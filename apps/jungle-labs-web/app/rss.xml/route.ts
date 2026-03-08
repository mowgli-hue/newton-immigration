import { getAllBlogPosts } from "../lib/blog";

export async function GET() {
  const site = "https://www.junglelabsworld.ca";
  const posts = getAllBlogPosts();

  const items = posts
    .map(
      (post) => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <description><![CDATA[${post.description}]]></description>
        <link>${site}/blog/${post.slug}</link>
        <guid>${site}/blog/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Jungle Labs Blog</title>
      <link>${site}/blog</link>
      <description>AI automation, analytics, CRM, and software system insights.</description>
      ${items}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
