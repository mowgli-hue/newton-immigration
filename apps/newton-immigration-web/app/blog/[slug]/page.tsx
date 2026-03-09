import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/site-data";

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase text-newton-red">{post.category}</p>
      <h1 className="mt-2 text-3xl font-semibold">{post.title}</h1>
      <p className="mt-4 text-base text-newton-dark/80">{post.summary}</p>
      <p className="mt-6 text-sm leading-7 text-newton-dark/80">{post.body}</p>
      <div className="mt-8 rounded-xl bg-white p-5 shadow-glass">
        <h2 className="text-lg font-semibold">Need tailored guidance?</h2>
        <p className="mt-2 text-sm text-newton-dark/75">Book a strategy consultation for personalized next steps.</p>
        <Link href="/consultation" className="mt-4 inline-block rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white">Book Consultation</Link>
      </div>
    </article>
  );
}
