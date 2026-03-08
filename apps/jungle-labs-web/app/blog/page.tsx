import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../components/SiteFooter";
import { getAllBlogPosts } from "../lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Insights on AI automation, software systems, analytics, and digital infrastructure."
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <main>
      <Navbar />
      <section className="section-shell pt-16">
        <p className="section-kicker">Insights</p>
        <h1 className="section-title">Jungle Labs Blog</h1>
        <p className="mt-4 max-w-2xl text-white/70">
          Technical and strategic writing on AI automation, business analytics, CRM systems, and digital operations.
        </p>

        <div className="mt-10 grid gap-5">
          {posts.map((post) => (
            <article key={post.slug} className="glass-card p-6">
              <p className="text-xs uppercase tracking-[0.1em] text-cyan-200/80">{new Date(post.date).toLocaleDateString()}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{post.title}</h2>
              <p className="mt-3 text-white/75">{post.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex text-sm font-semibold text-emerald-200 hover:text-emerald-100">
                Read article
              </Link>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
