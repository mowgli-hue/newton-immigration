import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "French Learning Resources",
  description:
    "French learning resources from Jungle Labs: beginner guides, speaking practice methods, app comparisons, and Franco downloads.",
  alternates: { canonical: "/french-learning-resources" }
};

const resources = [
  {
    href: "/learn-french",
    title: "Learn French With AI",
    description: "Core guide to learning French with structured AI-supported practice."
  },
  {
    href: "/learn-french-for-beginners",
    title: "Learn French for Beginners",
    description: "A practical beginner roadmap with daily study structure."
  },
  {
    href: "/how-to-practice-french-speaking",
    title: "How to Practice French Speaking",
    description: "Speaking-focused routines for faster confidence and fluency."
  },
  {
    href: "/best-app-to-learn-french",
    title: "Best App to Learn French",
    description: "What to look for in a French learning app and how Franco fits."
  }
];

export default function FrenchLearningResourcesPage() {
  return (
    <main>
      <Navbar />
      <section className="section-shell pt-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-sky-300/30 bg-gradient-to-br from-sky-500/25 via-cyan-500/15 to-emerald-400/20 p-8 md:p-10">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">French Learning Resources</h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Explore all Jungle Labs French learning guides in one place and download Franco for desktop.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-0.1.0.dmg" className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900">
              Download macOS (.dmg)
            </a>
            <a href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-Setup-0.1.0.exe" className="inline-flex rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
              Download Windows (.exe)
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {resources.map((item) => (
            <article key={item.href} className="glass-card p-5">
              <h2 className="text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-white/75">{item.description}</p>
              <Link href={item.href} className="mt-4 inline-flex text-sm font-semibold text-cyan-200 hover:text-cyan-100">
                Open guide
              </Link>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
