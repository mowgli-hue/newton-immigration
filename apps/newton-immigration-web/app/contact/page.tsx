"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { companyInfo, locations, socialLinks } from "@/lib/site-data";

type ContactFormData = {
  fullName: string;
  email: string;
  phone: string;
  message: string;
};

export default function ContactPage() {
  const { register, handleSubmit, reset } = useForm<ContactFormData>();
  const [status, setStatus] = useState("");

  const onSubmit = async (values: ContactFormData) => {
    setStatus("Submitting...");
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "contact", ...values })
    });

    if (res.ok) {
      reset();
      setStatus("Message sent successfully.");
      return;
    }

    setStatus("Unable to send message.");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-3 text-sm text-newton-dark/75">Reach Newton Immigration through phone, email, office visits, or the contact form.</p>
      <p className="mt-1 text-sm text-newton-dark/75">{companyInfo.coverage}</p>
      <p className="mt-1 text-sm text-newton-dark/75">
        Official emails: {companyInfo.emails.join(" | ")}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {locations.map((location) => (
          <article key={location.city} className="glass-card rounded-xl p-5 shadow-glass">
            <h2 className="font-semibold">{location.city}</h2>
            <p className="mt-2 text-sm text-newton-dark/75">{location.address}</p>
            <p className="mt-2 text-sm">{location.phone}</p>
            <p className="text-sm">{location.email}</p>
            <a href={location.map.replace("&output=embed", "")} target="_blank" className="mt-3 inline-block text-sm font-semibold text-newton-red">Open map</a>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <a href={socialLinks.instagram} target="_blank" className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-newton-dark">Instagram</a>
        <a href={socialLinks.youtube} target="_blank" className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-newton-dark">YouTube</a>
        <a href={socialLinks.google} target="_blank" className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-newton-dark">Google Profile</a>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card mt-8 space-y-4 rounded-xl p-5 shadow-glass">
        <h2 className="text-lg font-semibold">Send a Message</h2>
        <label className="block text-sm">Full Name<input className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("fullName", { required: true })} /></label>
        <label className="block text-sm">Email<input type="email" className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("email", { required: true })} /></label>
        <label className="block text-sm">Phone<input className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("phone", { required: true })} /></label>
        <label className="block text-sm">Message<textarea rows={4} className="mt-1 w-full rounded border border-black/15 px-3 py-2" {...register("message", { required: true })} /></label>

        <button className="rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white" type="submit">Send</button>
        {status ? <p className="text-sm text-newton-dark/75">{status}</p> : null}
      </form>
    </section>
  );
}
