import { newsItems } from "@/lib/site-data";

export default function ImmigrationNewsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Immigration News</h1>
      <p className="mt-3 text-sm text-newton-dark/75">Track Express Entry draws, policy updates, PNP activity, and work permit changes.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {newsItems.map((item) => (
          <article key={item.title} className="glass-card rounded-xl p-5 shadow-glass">
            <p className="text-xs font-semibold uppercase text-newton-red">{item.category}</p>
            <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-newton-dark/75">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
