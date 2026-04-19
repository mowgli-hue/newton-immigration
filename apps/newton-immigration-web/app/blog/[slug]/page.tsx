import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/site-data";
import type { Metadata } from "next";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function getPost(slug: string) {
  // Try DB first
  try {
    const res = await pool.query(`SELECT * FROM blog_posts WHERE slug = $1`, [slug]);
    if (res.rows[0]) return { ...res.rows[0], fromDb: true };
  } catch(e) {}
  // Fall back to static
  const static_ = blogPosts.find(p => p.slug === slug);
  return static_ || null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} | Newton Immigration`,
    description: post.summary,
    keywords: post.keywords || post.category,
    openGraph: { title: post.title, description: post.summary, type: "article" },
    alternates: { canonical: `https://www.newtonimmigration.com/blog/${params.slug}` }
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase text-newton-red">{post.category}</p>
      <h1 className="mt-2 text-3xl font-bold">{post.title}</h1>
      {post.published_at && (
        <p className="mt-2 text-sm text-newton-dark/50">
          Published {new Date(post.published_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })} · Newton Immigration
        </p>
      )}
      <div className="mt-6 prose prose-newton max-w-none text-newton-dark/85 leading-relaxed">
        {post.content ? (
          post.content.split("\n").map((line: string, i: number) => {
            if (line.startsWith("## ")) return <h2 key={i} className="mt-8 text-2xl font-bold">{line.replace("## ", "")}</h2>;
            if (line.startsWith("### ")) return <h3 key={i} className="mt-6 text-xl font-semibold">{line.replace("### ", "")}</h3>;
            if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc">{line.replace("- ", "")}</li>;
            if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold">{line.replace(/\*\*/g, "")}</p>;
            if (!line.trim()) return <br key={i} />;
            return <p key={i} className="mt-3">{line}</p>;
          })
        ) : (
          <p>{post.summary}</p>
        )}
      </div>
      <div className="mt-12 rounded-xl border border-newton-red/20 bg-red-50 p-6">
        <p className="font-semibold text-newton-dark">Need personalized immigration advice?</p>
        <p className="mt-1 text-sm text-newton-dark/75">Book a free consultation with our RCIC regulated consultants.</p>
        <a href="/consultation" className="mt-3 inline-block rounded-lg bg-newton-red px-4 py-2 text-sm font-bold text-white">Book Free Consultation →</a>
      </div>
    </article>
  );
}
