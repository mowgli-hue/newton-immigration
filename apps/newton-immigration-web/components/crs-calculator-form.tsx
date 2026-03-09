"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { calculateCRS, CRSInput } from "@/lib/crs";

type FormData = CRSInput;

export function CRSCalculatorForm() {
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      age: 30,
      education: 120,
      language: 120,
      foreignWork: 25,
      canadianWork: 40,
      spouse: 10,
      additional: 20
    }
  });
  const [score, setScore] = useState<number>(462);

  const onSubmit = (data: FormData) => {
    setScore(calculateCRS(data));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-xl p-5 shadow-glass">
        <h2 className="text-xl font-semibold">CRS Calculator</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Age<input type="number" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("age", { valueAsNumber: true })} /></label>
          <label className="text-sm">Education Points<input type="number" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("education", { valueAsNumber: true })} /></label>
          <label className="text-sm">Language Test Points<input type="number" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("language", { valueAsNumber: true })} /></label>
          <label className="text-sm">Foreign Work Experience<input type="number" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("foreignWork", { valueAsNumber: true })} /></label>
          <label className="text-sm">Canadian Work Experience<input type="number" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("canadianWork", { valueAsNumber: true })} /></label>
          <label className="text-sm">Spouse Factors<input type="number" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("spouse", { valueAsNumber: true })} /></label>
          <label className="text-sm sm:col-span-2">Additional Points<input type="number" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("additional", { valueAsNumber: true })} /></label>
        </div>
        <button type="submit" className="mt-4 rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white">Calculate</button>
      </form>

      <div className="glass-card rounded-xl p-5 shadow-glass">
        <h3 className="text-xl font-semibold">Your CRS Score: {score}</h3>
        <p className="mt-3 text-sm text-newton-dark/75">Possible immigration pathways:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-newton-dark/85">
          <li>Express Entry</li>
          <li>PNP nomination</li>
          <li>French category draw</li>
        </ul>

        <div className="mt-6 rounded-lg border border-newton-red/30 bg-red-50 p-4">
          <p className="text-sm font-semibold">Unlock Detailed PR Strategy Report</p>
          <p className="mt-1 text-sm text-newton-dark/75">Purchase a personalized analysis with score optimization strategy.</p>
          <Link href="/pr-strategy-report" className="mt-3 inline-block rounded bg-newton-red px-4 py-2 text-sm font-semibold text-white">View Paid Reports</Link>
        </div>
      </div>
    </div>
  );
}
