import type { Metadata } from "next";

import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Learn French With AI",
  description:
    "Learn French faster with Franco. Practical methods, speaking routines, and AI-supported training with desktop downloads.",
  alternates: {
    canonical: "/learn-french"
  },
  openGraph: {
    title: "Learn French With AI | Franco by Jungle Labs",
    description:
      "Learn French faster using AI-supported speaking practice, reflex training, and structured lesson routines.",
    url: "/learn-french",
    type: "article"
  }
};

const faqs = [
  {
    q: "What is the fastest way to learn French speaking?",
    a: "Consistent speaking practice, feedback loops, and daily reflex training are the fastest path for most learners."
  },
  {
    q: "Can I learn French with AI tools?",
    a: "Yes. AI tools can provide pronunciation feedback, speaking prompts, and adaptive practice based on your level."
  },
  {
    q: "Is Franco available on desktop?",
    a: "Yes. Franco is available for macOS and Windows through direct desktop downloads."
  }
];

export default function LearnFrenchPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <section className="section-shell pt-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-sky-300/30 bg-gradient-to-br from-sky-500/25 via-teal-500/15 to-emerald-400/20 px-8 py-10 md:px-10 md:py-12">
          <div className="absolute -right-14 -top-12 h-48 w-48 rounded-full bg-sky-300/35 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-emerald-300/25 blur-3xl" />

          <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-sky-100">French Learning</p>
          <h1 className="relative mt-2 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Learn French With AI Coaching and Reflex Training
          </h1>
          <p className="relative mt-4 max-w-3xl text-white/85">
            If you searched for learn French, you are in the right place. Franco helps you improve speaking confidence
            through adaptive lessons, guided practice, and practical conversation drills.
          </p>

          <div className="relative mt-7 flex flex-wrap gap-3">
            <a
              href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-0.1.0.dmg"
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-sky-100"
            >
              Download for macOS (.dmg)
            </a>
            <a
              href="https://github.com/mowgli-hue/Franco/releases/download/v0.1.1/Franco-Setup-0.1.0.exe"
              className="inline-flex rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Download for Windows (.exe)
            </a>
          </div>
        </div>

        <article className="prose prose-invert mt-10 max-w-3xl prose-headings:text-white prose-p:text-white/80 prose-li:text-white/80">
          <h2>Why Most People Struggle to Learn French</h2>
          <p>
            Most learners spend too much time reading and not enough time speaking. Real progress happens when practice
            includes listening, response speed, pronunciation correction, and repeated speaking loops.
          </p>

          <h2>How Franco Helps You Learn Faster</h2>
          <ul>
            <li>Adaptive exercises that adjust to your current level</li>
            <li>AI-supported speaking prompts and correction loops</li>
            <li>Gamified routines to build daily consistency</li>
            <li>Structured progression from beginner to fluent communication</li>
          </ul>

          <h2>Best Daily Method</h2>
          <p>
            Use 20-30 minute daily sessions focused on speaking and listening. Keep repetition high, track weak areas,
            and prioritize practical phrases used in real conversations.
          </p>

          <h2>Start Today</h2>
          <p>
            Download Franco for desktop and begin with a structured routine. Consistency over intensity is the fastest
            route to long-term fluency.
          </p>
        </article>

        <div className="mt-10 rounded-3xl border border-white/10 bg-black/35 p-6">
          <h2 className="text-2xl font-semibold text-white">Learn French FAQ</h2>
          <div className="mt-5 space-y-4">
            {faqs.map((item) => (
              <article key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-base font-semibold text-sky-100">{item.q}</h3>
                <p className="mt-2 text-white/80">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
