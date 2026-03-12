import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Best App To Learn French",
  description: "What makes the best app to learn French: adaptive lessons, speaking feedback, and daily progression loops.",
  alternates: { canonical: "/best-app-to-learn-french" }
};

export default function BestAppLearnFrenchPage() {
  return (
    <main>
      <Navbar />
      <section className="section-shell pt-16">
        <p className="section-kicker">French App Guide</p>
        <h1 className="section-title">Best App to Learn French: What to Look For</h1>
        <article className="prose prose-invert mt-8 max-w-3xl prose-headings:text-white prose-p:text-white/80 prose-li:text-white/80">
          <p>The best app to learn French should improve speaking, not just vocabulary recall. Focus on tools with active speaking feedback.</p>
          <h2>Essential Features</h2>
          <ul>
            <li>Adaptive lessons matched to your level</li>
            <li>Pronunciation and speaking correction</li>
            <li>Daily progress loops and reminders</li>
            <li>Practical conversation scenarios</li>
          </ul>
          <h2>Why Franco</h2>
          <p>Franco combines reflex learning, speaking drills, and structured progression so users can build real conversational confidence.</p>
        </article>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-0.1.0.dmg" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900">Download Franco for macOS</a>
          <a href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-Setup-0.1.0.exe" className="inline-flex rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white">Download Franco for Windows</a>
        </div>
        <div className="mt-8 text-sm text-white/75">
          Related: <Link href="/learn-french-for-beginners" className="text-cyan-200 hover:text-cyan-100">Learn French for beginners</Link> · <Link href="/how-to-practice-french-speaking" className="text-cyan-200 hover:text-cyan-100">How to practice French speaking</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
