"use client";

import { motion } from "framer-motion";
import { CalendarDays, Rocket } from "lucide-react";

import { AnimatedSection } from "./AnimatedSection";
import { trackEvent } from "../lib/analytics";

export function ContactCTA() {
  return (
    <AnimatedSection id="contact" className="section-shell mt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="glass-card relative overflow-hidden p-8 md:p-12"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-emerald-300/15 blur-3xl" />

        <h2 className="relative text-3xl font-semibold tracking-tight text-white md:text-5xl">Let&apos;s Build the Future of Your Business</h2>
        <p className="relative mt-4 max-w-2xl text-white/70">
          Tell us your vision. We will help you architect, build, and deploy an intelligent digital system designed for outcomes.
        </p>

        <div className="relative mt-8 flex flex-wrap gap-4">
          <a
            href="mailto:admin@junglelabsworld.com"
            onClick={() => trackEvent("start_project_click", { placement: "contact_cta" })}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            <Rocket className="h-4 w-4" />
            Start Project
          </a>
          <a
            href="tel:+16049028699"
            onClick={() => trackEvent("schedule_consultation_click", { placement: "contact_cta" })}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:text-cyan-200"
          >
            <CalendarDays className="h-4 w-4" />
            Schedule Consultation
          </a>
        </div>
      </motion.div>
    </AnimatedSection>
  );
}
