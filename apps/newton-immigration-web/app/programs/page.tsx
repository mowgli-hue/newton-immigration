import { ProgramCard } from "@/components/program-card";
import { programs } from "@/lib/site-data";

export default function ProgramsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Immigration Programs</h1>
      <p className="mt-3 max-w-3xl text-sm text-newton-dark/75">Explore Canadian immigration pathways with structured eligibility and process guidance.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <ProgramCard key={program.slug} program={program} />
        ))}
      </div>
    </section>
  );
}
