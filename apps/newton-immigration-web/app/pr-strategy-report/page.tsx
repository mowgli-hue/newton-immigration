import { PricingCards } from "@/components/pricing-card";

export default function PRStrategyReportPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Paid PR Strategy Report</h1>
      <p className="mt-3 max-w-3xl text-sm text-newton-dark/75">Purchase an immigration analysis with CRS optimization, PNP matching, French opportunity planning, and timeline forecasting.</p>

      <div className="mt-6">
        <PricingCards />
      </div>

      <article className="glass-card mt-8 rounded-xl p-5 shadow-glass">
        <h2 className="text-xl font-semibold">Example Report</h2>
        <p className="mt-3 text-sm">Your CRS Score: <span className="font-semibold text-newton-red">468</span></p>
        <div className="mt-4 text-sm">
          <p className="font-semibold">Recommended strategies:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-newton-dark/75">
            <li>Improve IELTS to CLB 9 (+32 points)</li>
            <li>Learn French NCLC 5 (+50 points)</li>
            <li>Explore Provincial Nominee Programs</li>
          </ul>
          <p className="mt-3">Estimated PR timeline: 8 to 14 months.</p>
        </div>
      </article>
    </section>
  );
}
