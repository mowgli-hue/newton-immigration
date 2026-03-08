import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AnimatedSection } from "../components/AnimatedSection";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../components/SiteFooter";
import { SystemBlueprintIllustration } from "../components/SystemBlueprintIllustration";
import { services } from "../lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore Jungle Labs services: AI automation systems, custom CRM systems, software development, and analytics platforms."
};

export default function ServicesPage() {
  return (
    <main>
      <Navbar />
      <AnimatedSection className="section-shell pt-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/75 transition hover:border-cyan-300/35 hover:text-cyan-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back Home
        </Link>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <p className="section-kicker">Services</p>
            <h1 className="section-title">AI and software systems for high-growth teams</h1>
            <p className="mt-4 text-white/70">
              We architect and build business-critical software from automation engines to analytics platforms. Every
              system is designed for speed, reliability, and measurable ROI.
            </p>
          </div>
          <SystemBlueprintIllustration />
        </div>
      </AnimatedSection>

      <AnimatedSection className="section-shell mt-12">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article key={service.title} className="glass-card p-6">
                <span className="mb-4 inline-flex rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-semibold text-white">{service.title}</h2>
                <p className="mt-3 text-white/72">{service.short}</p>
                <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-relaxed text-cyan-100/80">{service.details}</p>
              </article>
            );
          })}
        </div>
      </AnimatedSection>
      <SiteFooter />
    </main>
  );
}
