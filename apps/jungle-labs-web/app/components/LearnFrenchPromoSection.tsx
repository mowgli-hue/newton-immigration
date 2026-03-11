import Link from "next/link";

import { AnimatedSection } from "./AnimatedSection";

export function LearnFrenchPromoSection() {
  return (
    <AnimatedSection className="section-shell mt-20">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-sky-300/25 bg-gradient-to-br from-sky-500/20 via-cyan-500/10 to-emerald-400/15 p-7 md:p-9">
        <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute -left-12 -bottom-16 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative grid gap-5 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-sky-100/90">Franco Learning App</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Learn French Faster With AI Coaching</h2>
            <p className="mt-3 max-w-2xl text-white/80">
              Explore our dedicated French learning guide, compare methods, and download Franco for macOS or Windows.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              href="/learn-french"
              className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-sky-100"
            >
              Read Learn French Guide
            </Link>
            <a
              href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-0.1.0.dmg"
              className="inline-flex rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Download Franco
            </a>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
