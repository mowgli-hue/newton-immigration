import Link from "next/link";
import { notFound } from "next/navigation";
import { programs } from "@/lib/site-data";

export default function ProgramDetailPage({ params }: { params: { slug: string } }) {
  const program = programs.find((item) => item.slug === params.slug);
  if (!program) return notFound();

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{program.title}</h1>
      <p className="mt-3 text-sm text-newton-dark/75">{program.description}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="glass-card rounded-xl p-5 shadow-glass">
          <h2 className="font-semibold">Eligibility Criteria</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-newton-dark/75">{program.eligibility.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="glass-card rounded-xl p-5 shadow-glass">
          <h2 className="font-semibold">Required Documents</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-newton-dark/75">{program.documents.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="glass-card rounded-xl p-5 shadow-glass">
          <h2 className="font-semibold">Process Overview</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-newton-dark/75">{program.process.map((item) => <li key={item}>{item}</li>)}</ol>
        </article>
        <article className="glass-card rounded-xl p-5 shadow-glass">
          <h2 className="font-semibold">Estimated Timeline</h2>
          <p className="mt-3 text-sm text-newton-dark/75">{program.timeline}</p>
          <Link href="/consultation" className="mt-4 inline-block rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white">Book Consultation</Link>
        </article>
      </div>
    </section>
  );
}
