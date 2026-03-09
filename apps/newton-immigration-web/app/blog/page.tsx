import Link from "next/link";
import { blogPosts } from "@/lib/site-data";

export default function BlogPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Blog / Knowledge Hub</h1>
      <p className="mt-3 text-sm text-newton-dark/75">Actionable immigration strategy insights across Express Entry, work permits, PNP programs, and study-to-PR planning.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <article key={post.slug} className="glass-card rounded-xl p-5 shadow-glass">
            <p className="text-xs font-semibold uppercase text-newton-red">{post.category}</p>
            <h2 className="mt-2 text-lg font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm text-newton-dark/75">{post.summary}</p>
            <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-semibold text-newton-red">Read article</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
