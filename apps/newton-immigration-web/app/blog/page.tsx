import Link from "next/link";
import { blogPosts as staticPosts } from "@/lib/site-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canada Immigration Blog 2026 | Expert Tips & Guides | Newton Immigration",
  description: "Read expert immigration guides, tips and insights. Stay informed about Express Entry draws, work permits, PR pathways and IRCC updates.",
  keywords: "Canada immigration blog, immigration tips 2026, Express Entry guide, PR Canada tips, IRCC updates blog"
};

async function getDbPosts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.newtonimmigration.com"}/api/generate-blog`, {
      next: { revalidate: 3600 }
    });
    const data = await res.json() as any;
    return data.posts || [];
  } catch { return []; }
}

export default async function BlogPage() {
  const dbPosts = await getDbPosts();
  const allPosts = [
    ...dbPosts.map((p: any) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      summary: p.summary,
      publishedAt: p.published_at,
      isAI: true
    })),
    ...staticPosts.map(p => ({ ...p, isAI: false }))
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Immigration Blog & Knowledge Hub</h1>
      <p className="mt-3 text-sm text-newton-dark/75">Expert immigration strategy insights — Express Entry, work permits, PNP programs, study-to-PR planning. Updated weekly.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allPosts.map((post: any) => (
          <article key={post.slug} className="glass-card rounded-xl p-5 shadow-glass">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase text-newton-red">{post.category}</p>
              {post.isAI && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">NEW</span>}
            </div>
            <h2 className="mt-2 text-lg font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm text-newton-dark/75">{post.summary}</p>
            {post.publishedAt && <p className="mt-1 text-xs text-newton-dark/50">{new Date(post.publishedAt).toLocaleDateString("en-CA")}</p>}
            <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-semibold text-newton-red">Read article →</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
