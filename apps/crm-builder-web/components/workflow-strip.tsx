import { workflowBlocks } from "@/lib/data";

export function WorkflowStrip() {
  return (
    <section className="grid gap-3 md:grid-cols-5">
      {workflowBlocks.map((step) => (
        <article key={step.title} className="rounded-xl border border-slate-200 bg-panel p-4 shadow-soft">
          <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
          <p className="mt-1 text-xs text-slate-600">{step.detail}</p>
        </article>
      ))}
    </section>
  );
}
