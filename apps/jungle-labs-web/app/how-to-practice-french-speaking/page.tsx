import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "How To Practice French Speaking",
  description: "Actionable methods to practice French speaking daily with AI prompts, repetition loops, and pronunciation feedback.",
  alternates: { canonical: "/how-to-practice-french-speaking" }
};

export default function PracticeFrenchSpeakingPage() {
  return (
    <main>
      <Navbar />
      <section className="section-shell pt-16">
        <p className="section-kicker">Speaking Practice</p>
        <h1 className="section-title">How to Practice French Speaking Every Day</h1>
        <article className="prose prose-invert mt-8 max-w-3xl prose-headings:text-white prose-p:text-white/80 prose-li:text-white/80">
          <p>Speaking is the skill that most learners delay. The fastest path is short, daily speaking loops with correction.</p>
          <h2>Use Prompt-Based Drills</h2>
          <p>Answer one prompt at a time: introduce yourself, explain your work, ask a question, or describe a routine.</p>
          <h2>Repeat and Refine</h2>
          <ul>
            <li>Record your answer</li>
            <li>Compare with corrected version</li>
            <li>Repeat until delivery is natural</li>
          </ul>
          <h2>Track Weekly Gains</h2>
          <p>Measure speaking confidence, response speed, and pronunciation clarity each week. Progress is easier when measured.</p>
        </article>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-0.1.0.dmg" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900">Download Franco for macOS</a>
          <a href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-Setup-0.1.0.exe" className="inline-flex rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white">Download Franco for Windows</a>
        </div>
        <div className="mt-8 text-sm text-white/75">
          Related: <Link href="/learn-french" className="text-cyan-200 hover:text-cyan-100">Learn French with AI</Link> · <Link href="/best-app-to-learn-french" className="text-cyan-200 hover:text-cyan-100">Best app to learn French</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
