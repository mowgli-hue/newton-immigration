import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Learn French For Beginners",
  description: "Beginner-friendly French learning roadmap with daily routines, speaking practice tips, and Franco app desktop downloads.",
  alternates: { canonical: "/learn-french-for-beginners" }
};

const faqs = [
  { q: "How should beginners start learning French?", a: "Start with high-frequency vocabulary, daily listening, and short speaking sessions focused on practical phrases." },
  { q: "How many minutes a day should I study French?", a: "20 to 30 minutes daily is effective if practice includes speaking and listening, not just reading." }
];

export default function LearnFrenchBeginnersPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } }))
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <section className="section-shell pt-16">
        <p className="section-kicker">French Learning Guide</p>
        <h1 className="section-title">Learn French for Beginners: A Practical 30-Day Plan</h1>
        <article className="prose prose-invert mt-8 max-w-3xl prose-headings:text-white prose-p:text-white/80 prose-li:text-white/80">
          <p>Beginners improve fastest with consistency. Focus on daily repetition, simple speaking prompts, and practical phrases used in real life.</p>
          <h2>Week 1: Build Core Vocabulary</h2>
          <ul>
            <li>Learn 15-20 high-frequency words daily</li>
            <li>Practice greetings and introductions aloud</li>
            <li>Use short listening clips with replay</li>
          </ul>
          <h2>Week 2: Start Speaking in Short Sentences</h2>
          <p>Use guided prompts to answer common questions. Prioritize pronunciation and response speed over perfect grammar.</p>
          <h2>Week 3-4: Conversation Routines</h2>
          <p>Run daily conversation drills on common scenarios: ordering food, asking directions, describing your day, and work discussions.</p>
        </article>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-0.1.0.dmg" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900">Download Franco for macOS</a>
          <a href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-Setup-0.1.0.exe" className="inline-flex rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white">Download Franco for Windows</a>
        </div>
        <div className="mt-8 text-sm text-white/75">
          Related: <Link href="/learn-french" className="text-cyan-200 hover:text-cyan-100">Learn French with AI</Link> · <Link href="/how-to-practice-french-speaking" className="text-cyan-200 hover:text-cyan-100">How to practice French speaking</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
