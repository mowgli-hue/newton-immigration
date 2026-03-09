"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="pointer-events-none absolute inset-0">
        {[...Array(16)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-newton-red/30"
            style={{ left: `${(i * 11) % 100}%`, top: `${(i * 7) % 100}%` }}
            animate={{ y: [0, -22, 0], opacity: [0.25, 0.65, 0.25] }}
            transition={{ duration: 3 + i * 0.22, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-newton-red/30 bg-white/75 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-newton-red">
            Canada Immigration Advisory Platform
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-newton-dark sm:text-5xl">Your Trusted Pathway to Canada Immigration</h1>
          <p className="mt-5 text-base text-newton-dark/80 sm:text-lg">
            Newton Immigration helps individuals and families navigate Express Entry, work permits, provincial nominee programs, and permanent residence pathways with expert guidance.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/assessment" className="rounded-md bg-newton-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-newton-accent">
              Free Immigration Assessment
            </Link>
            <Link href="/crs-calculator" className="rounded-md border border-newton-dark/20 bg-white px-5 py-3 text-sm font-semibold text-newton-dark transition hover:border-newton-red hover:text-newton-red">
              Calculate CRS Score
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
