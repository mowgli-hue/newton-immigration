import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../components/SiteFooter";
import { getAllBlogPosts, getBlogHtml, getBlogPostBySlug } from "../../lib/blog";

export async function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `/blog/${post.slug}`
    }
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);
  const html = getBlogHtml(params.slug);

  if (!post || !html) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "Jungle Labs"
    },
    publisher: {
      "@type": "Organization",
      name: "Jungle Labs"
    },
    mainEntityOfPage: `https://www.junglelabsworld.ca/blog/${post.slug}`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <article className="section-shell pt-16">
        <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/80">{new Date(post.date).toLocaleDateString()}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">{post.title}</h1>
        <p className="mt-4 max-w-3xl text-lg text-white/75">{post.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
              {tag}
            </span>
          ))}
        </div>
        <div
          className="prose prose-invert mt-10 max-w-3xl prose-headings:text-white prose-p:text-white/80 prose-li:text-white/80"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
      <SiteFooter />
    </main>
  );
}
