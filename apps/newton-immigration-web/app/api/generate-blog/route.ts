import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Pool } from "pg";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body.token !== (process.env.AUTH_RECOVERY_TOKEN || "newton-recovery-2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure blog table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      keywords TEXT,
      published_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Get latest IRCC news for blog topic
  let newsTopic = body.topic || "";
  if (!newsTopic) {
    try {
      const rssRes = await fetch("https://www.canada.ca/en/immigration-refugees-citizenship/news.atom.xml");
      const xml = await rssRes.text();
      const titles = xml.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)?.slice(1, 4) || [];
      newsTopic = titles.map(t => t.replace(/<[^>]+>/g, "").replace(/CDATA\[|\]\]/g, "")).join(", ");
    } catch(e) {}
  }

  // Generate blog post with Claude
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver", year: "numeric", month: "long", day: "numeric" });
  
  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: `Write a comprehensive, SEO-optimized immigration blog post for Newton Immigration's website (newtonimmigration.com).

Today: ${today}
Recent IRCC news: ${newsTopic || "Latest Canadian immigration updates"}

Requirements:
- Write for Canadians and immigrants interested in Canadian immigration
- Target keywords naturally throughout (Express Entry, Canada PR, work permit, etc.)
- Include practical actionable advice
- Professional but approachable tone
- Newton Immigration is RCIC regulated in Surrey BC

Reply ONLY with valid JSON (no markdown):
{
  "slug": "url-friendly-slug-2026",
  "title": "SEO optimized title with keywords",
  "category": "Express Entry|Work Permits|Study Permits|PR|PNP|Family Sponsorship|Immigration Tips",
  "summary": "2-sentence meta description with keywords (max 160 chars)",
  "keywords": "comma separated keywords",
  "content": "Full blog post in markdown format with ## headings, practical tips, at least 600 words"
}`
      }]
    })
  });

  if (!aiRes.ok) throw new Error("AI generation failed");
  const aiData = await aiRes.json() as any;
  const raw = aiData.content?.[0]?.text || "{}";
  const post = JSON.parse(raw.replace(/```json|```/g, "").trim());

  // Save to database
  await pool.query(`
    INSERT INTO blog_posts (slug, title, category, summary, content, keywords, published_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      updated_at = NOW()
  `, [post.slug, post.title, post.category, post.summary, post.content, post.keywords]);

  // Revalidate blog pages
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/");

  return NextResponse.json({ ok: true, slug: post.slug, title: post.title });
}

export async function GET() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      keywords TEXT,
      published_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  const res = await pool.query(`SELECT slug, title, category, summary, keywords, published_at FROM blog_posts ORDER BY published_at DESC LIMIT 20`);
  return NextResponse.json({ posts: res.rows });
}
