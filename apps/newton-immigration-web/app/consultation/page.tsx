"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";

type ConsultationFormData = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  immigrationGoal: string;
  consultationType: "15-minute quick consultation" | "30-minute strategy consultation";
  message: string;
};

export default function ConsultationPage() {
  const { register, handleSubmit, reset } = useForm<ConsultationFormData>();
  const [status, setStatus] = useState<string>("");

  const onSubmit = async (values: ConsultationFormData) => {
    setStatus("Submitting...");
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "consultation", ...values })
    });

    if (res.ok) {
      reset();
      setStatus("Consultation request submitted.");
      return;
    }

    setStatus("Unable to submit request.");
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Book Consultation</h1>
      <p className="mt-3 text-sm text-newton-dark/75">Choose your consultation format and share your immigration goals.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card mt-6 space-y-4 rounded-xl p-5 shadow-glass">
        <label className="block text-sm">Full Name<input className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("fullName", { required: true })} /></label>
        <label className="block text-sm">Email<input type="email" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("email", { required: true })} /></label>
        <label className="block text-sm">Phone<input className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("phone", { required: true })} /></label>
        <label className="block text-sm">Country<input className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("country", { required: true })} /></label>
        <label className="block text-sm">Immigration Goal<input className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("immigrationGoal", { required: true })} /></label>

        <label className="block text-sm">Consultation Type
          <select className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("consultationType", { required: true })}>
            <option value="15-minute quick consultation">15 minute quick consultation</option>
            <option value="30-minute strategy consultation">30 minute strategy consultation</option>
          </select>
        </label>

        <label className="block text-sm">Message<textarea rows={4} className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("message")} /></label>

        <button className="rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white" type="submit">Submit</button>
        {status ? <p className="text-sm text-newton-dark/75">{status}</p> : null}
      </form>
    </section>
  );
}
