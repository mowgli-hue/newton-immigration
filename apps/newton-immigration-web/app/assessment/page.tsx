import { MultiStepAssessment } from "@/components/multi-step-assessment";

export default function AssessmentPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Free Immigration Assessment</h1>
      <p className="mt-3 text-sm text-newton-dark/75">Complete this assessment and receive a tailored eligibility review.</p>
      <MultiStepAssessment />
    </section>
  );
}
