export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">About Newton Immigration</h1>
      <p className="mt-4 text-sm leading-7 text-newton-dark/80">
        Newton Immigration is a consulting firm focused on practical, data-backed Canada immigration strategy. Our team supports individuals and families across Express Entry, provincial pathways, temporary permits, and PR planning.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="glass-card rounded-xl p-5 shadow-glass">
          <h2 className="font-semibold">Consultant Credentials</h2>
          <p className="mt-2 text-sm text-newton-dark/75">Licensed advisory team with cross-border case experience, policy interpretation expertise, and structured application management.</p>
        </article>
        <article className="glass-card rounded-xl p-5 shadow-glass">
          <h2 className="font-semibold">Mission</h2>
          <p className="mt-2 text-sm text-newton-dark/75">Deliver clear immigration pathways that reduce uncertainty and maximize long-term settlement outcomes.</p>
        </article>
      </div>
    </section>
  );
}
