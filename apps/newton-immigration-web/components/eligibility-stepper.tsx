"use client";

import { useMemo, useState } from "react";

type Answers = {
  ageBand: "18-29" | "30-39" | "40+";
  language: "high" | "mid" | "low";
  experience: "canadian" | "foreign" | "none";
};

const initialAnswers: Answers = {
  ageBand: "18-29",
  language: "mid",
  experience: "foreign"
};

export function EligibilityStepper() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);

  const pathways = useMemo(() => {
    const result = ["Express Entry"];

    if (answers.language === "high") {
      result.push("French category draw");
    }

    if (answers.experience === "canadian") {
      result.push("Canadian Experience Class (CEC)");
    }

    if (answers.experience !== "none") {
      result.push("Provincial Nominee Programs");
    }

    return result;
  }, [answers]);

  return (
    <div className="glass-card rounded-2xl p-6 shadow-glass">
      <h2 className="text-2xl font-semibold">Quick Eligibility Checker</h2>
      <p className="mt-2 text-sm text-newton-dark/75">Step {step} of 4</p>
      <div className="mt-3 h-2 w-full rounded-full bg-black/10">
        <div className="h-2 rounded-full bg-newton-red transition-all" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      {step === 1 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold">Age range</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(["18-29", "30-39", "40+"] as const).map((v) => (
              <button key={v} onClick={() => setAnswers((prev) => ({ ...prev, ageBand: v }))} className={`rounded-md border px-3 py-2 text-sm ${answers.ageBand === v ? "border-newton-red bg-red-50" : "border-black/10"}`}>{v}</button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold">Language profile</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {[{ v: "high", label: "CLB 9+" }, { v: "mid", label: "CLB 7-8" }, { v: "low", label: "Below CLB 7" }].map((item) => (
              <button key={item.v} onClick={() => setAnswers((prev) => ({ ...prev, language: item.v as Answers["language"] }))} className={`rounded-md border px-3 py-2 text-sm ${answers.language === item.v ? "border-newton-red bg-red-50" : "border-black/10"}`}>{item.label}</button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold">Work experience</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {[{ v: "canadian", label: "Canadian" }, { v: "foreign", label: "Foreign" }, { v: "none", label: "No experience" }].map((item) => (
              <button key={item.v} onClick={() => setAnswers((prev) => ({ ...prev, experience: item.v as Answers["experience"] }))} className={`rounded-md border px-3 py-2 text-sm ${answers.experience === item.v ? "border-newton-red bg-red-50" : "border-black/10"}`}>{item.label}</button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-5 rounded-xl border border-newton-red/25 bg-red-50 p-4">
          <p className="text-sm font-semibold">Recommended pathways</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-newton-dark/80">
            {pathways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex gap-2">
        <button onClick={() => setStep((prev) => Math.max(1, prev - 1))} className="rounded-md border border-black/15 px-4 py-2 text-sm" disabled={step === 1}>Back</button>
        {step < 4 ? (
          <button onClick={() => setStep((prev) => Math.min(4, prev + 1))} className="rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white">Next</button>
        ) : (
          <button onClick={() => { setStep(1); setAnswers(initialAnswers); }} className="rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white">Start Again</button>
        )}
      </div>
    </div>
  );
}
