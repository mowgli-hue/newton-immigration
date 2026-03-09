import { CRSCalculatorForm } from "@/components/crs-calculator-form";

export default function CRSCalculatorPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-semibold">CRS Calculator</h1>
      <p className="mt-3 text-sm text-newton-dark/75">Estimate your Comprehensive Ranking System score and evaluate practical PR pathways.</p>
      <div className="mt-6">
        <CRSCalculatorForm />
      </div>
    </section>
  );
}
