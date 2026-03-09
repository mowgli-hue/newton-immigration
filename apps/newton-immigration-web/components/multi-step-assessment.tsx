"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type AssessmentFormData = {
  age: number;
  country: string;
  education: string;
  languageTestScore: string;
  workExperience: string;
  canadianExperience: string;
};

export function MultiStepAssessment() {
  const { register, handleSubmit, watch } = useForm<AssessmentFormData>({
    defaultValues: {
      age: 28,
      country: "",
      education: "Bachelor",
      languageTestScore: "CLB 8",
      workExperience: "2 years",
      canadianExperience: "0 year"
    }
  });
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("");

  const values = watch();

  const previewScore = useMemo(() => {
    const agePoints = values.age >= 18 && values.age <= 35 ? 95 : values.age <= 40 ? 75 : 55;
    const eduPoints = values.education.includes("Master") ? 126 : values.education.includes("Bachelor") ? 112 : 90;
    const langPoints = values.languageTestScore.includes("9") ? 124 : values.languageTestScore.includes("8") ? 110 : 90;
    const workPoints = values.workExperience.includes("3") ? 50 : values.workExperience.includes("2") ? 35 : 20;
    const caPoints = values.canadianExperience.includes("1") ? 40 : 15;

    return agePoints + eduPoints + langPoints + workPoints + caPoints;
  }, [values]);

  const onSubmit = async (formValues: AssessmentFormData) => {
    setStatus("Submitting assessment...");
    const res = await fetch("/api/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues)
    });

    setStatus(res.ok ? "Assessment submitted successfully." : "Assessment submission failed.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card mt-6 rounded-xl p-5 shadow-glass">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assessment Form</h2>
        <p className="text-sm text-newton-dark/70">Step {step} of 4</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-black/10">
        <div className="h-2 rounded-full bg-newton-red transition-all" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      {step === 1 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Age<input type="number" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("age", { required: true, valueAsNumber: true })} /></label>
          <label className="text-sm">Country<input className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("country", { required: true })} /></label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Education
            <select className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("education", { required: true })}>
              <option>Bachelor</option>
              <option>Master</option>
              <option>Diploma</option>
              <option>High School</option>
            </select>
          </label>
          <label className="text-sm">Language test score
            <select className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("languageTestScore", { required: true })}>
              <option>CLB 9</option>
              <option>CLB 8</option>
              <option>CLB 7</option>
              <option>Below CLB 7</option>
            </select>
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Work experience
            <select className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("workExperience", { required: true })}>
              <option>1 year</option>
              <option>2 years</option>
              <option>3+ years</option>
            </select>
          </label>
          <label className="text-sm">Canadian experience
            <select className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("canadianExperience", { required: true })}>
              <option>0 year</option>
              <option>1 year</option>
              <option>2+ years</option>
            </select>
          </label>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-4 rounded-lg border border-newton-red/25 bg-red-50 p-4">
          <p className="text-sm font-semibold">Score Preview</p>
          <p className="mt-2 text-3xl font-semibold text-newton-red">{previewScore}</p>
          <p className="mt-1 text-sm text-newton-dark/75">This estimate helps you understand possible pathways before full profile analysis.</p>
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-2">
        <button type="button" onClick={() => setStep((prev) => Math.max(1, prev - 1))} className="rounded-md border border-black/15 px-4 py-2 text-sm" disabled={step === 1}>Back</button>
        {step < 4 ? (
          <button type="button" onClick={() => setStep((prev) => Math.min(4, prev + 1))} className="rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white">Next</button>
        ) : (
          <button className="rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white" type="submit">Submit Assessment</button>
        )}
      </div>

      {status ? <p className="mt-3 text-sm text-newton-dark/75">{status}</p> : null}
    </form>
  );
}
