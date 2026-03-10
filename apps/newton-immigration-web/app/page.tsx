import Link from "next/link";
import { ArrowRight, Calendar, Newspaper, Sparkles } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { AnimatedCounter } from "@/components/animated-counter";
import { HeroSection } from "@/components/hero";
import { ProgramCard } from "@/components/program-card";
import { AIAdvisorChat } from "@/components/ai-chat";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import { FAQAccordion } from "@/components/faq-accordion";
import { EligibilityStepper } from "@/components/eligibility-stepper";
import { ImmigrationTypesGallery } from "@/components/immigration-types-gallery";
import { InteractiveLocations } from "@/components/interactive-locations";
import { getLatestImmigrationNews } from "@/lib/news";
import { companyInfo, newsItems, programs, socialLinks, youtubeVideos } from "@/lib/site-data";

export default async function HomePage() {
  const liveNews = await getLatestImmigrationNews();
  const displayNews = liveNews.length ? liveNews.slice(0, 4) : newsItems;

  return (
    <>
      <HeroSection />

      <div className="grid-glow mx-auto max-w-7xl space-y-16 px-4 py-14">
        <AnimatedSection>
          <div className="grid gap-4 sm:grid-cols-3">
            <AnimatedCounter value={3500} label="Assessments Completed" />
            <AnimatedCounter value={92} label="Successful Strategy Outcomes (%)" />
            <AnimatedCounter value={18} label="Years Advisory Experience" />
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Immigration Programs</h2>
            <Link href="/programs" className="inline-flex items-center gap-2 text-sm font-semibold text-newton-red">See all <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <h2 className="text-2xl font-semibold">Canadian Immigration Types</h2>
          <p className="mt-2 text-sm text-newton-dark/75">Explore popular pathways for study, work, PR, and province-based nominations.</p>
          <div className="mt-5">
            <ImmigrationTypesGallery />
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="rounded-2xl border border-newton-red/30 bg-gradient-to-br from-red-950/50 to-black/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-newton-red">{companyInfo.legalName}</p>
            <h2 className="mt-2 text-2xl font-semibold">{companyInfo.tagline}</h2>
            <p className="mt-2 text-sm text-newton-dark/80">{companyInfo.coverage}</p>
            <p className="mt-2 text-sm text-newton-dark/80">Headquartered in {companyInfo.headquarters}. Branches: {companyInfo.branches.join(", ")}.</p>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="glass-card grid gap-6 rounded-2xl p-6 shadow-glass lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Boost Your CRS Score with French</h2>
              <p className="mt-3 text-sm text-newton-dark/75">
                Learning French can increase your CRS score and open additional immigration pathways.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="https://franco.app" target="_blank" className="rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white">
                  Start Learning French
                </Link>
                <Link href="https://franco.app" target="_blank" className="rounded-md border border-newton-dark/20 px-4 py-2 text-sm font-semibold text-newton-dark">
                  Visit Franco
                </Link>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-lg font-semibold">Why French Matters</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-newton-dark/75">
                <li>Access category-based draws</li>
                <li>Earn up to +50 additional CRS points</li>
                <li>Expand PNP eligibility options</li>
              </ul>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="relative">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Immigration News</h2>
            <Link href="/immigration-news" className="inline-flex items-center gap-2 text-sm font-semibold text-newton-red">View updates <Newspaper size={16} /></Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {displayNews.map((item) => (
              <article key={item.title} className="glass-card rounded-xl p-5 shadow-glass">
                <p className="text-xs font-semibold uppercase text-newton-red">{item.category}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-newton-dark/75">{item.text}</p>
                {"url" in item ? (
                  <a href={item.url as string} target="_blank" className="mt-3 inline-block text-sm font-semibold text-newton-red">
                    Read source
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <AIAdvisorChat />
        </AnimatedSection>

        <AnimatedSection>
          <div className="grid gap-4 lg:grid-cols-2">
            <EligibilityStepper />
            <FAQAccordion />
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <TestimonialsCarousel />
        </AnimatedSection>

        <AnimatedSection>
          <h2 className="text-2xl font-semibold">Office Locations</h2>
          <p className="mt-2 text-sm text-newton-dark/75">Visit our offices in Surrey, British Columbia or Calgary, Alberta.</p>
          <div className="mt-5">
            <InteractiveLocations />
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <h2 className="text-2xl font-semibold">Immigration Updates and Guidance</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {youtubeVideos.map((video) => (
              <a key={video} href={video} target="_blank" className="glass-card rounded-xl p-5 shadow-glass transition hover:-translate-y-1">
                <p className="text-xs font-semibold uppercase text-newton-red">YouTube</p>
                <h3 className="mt-2 text-base font-semibold">Watch Newton Immigration Updates</h3>
                <p className="mt-2 text-sm text-newton-dark/75">Latest guidance, policy updates, and pathway explainers.</p>
              </a>
            ))}
          </div>
          <div className="mt-3">
            <a href={socialLinks.youtube} target="_blank" className="text-sm font-semibold text-newton-red">Go to official YouTube channel</a>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="rounded-2xl bg-[#101722] px-6 py-10 text-white">
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-xl border border-white/15 p-5">
                <Sparkles className="text-newton-red" />
                <h3 className="mt-3 font-semibold">Smart Profile Optimization</h3>
                <p className="mt-2 text-sm text-white/70">We map language, work, and nomination opportunities into one practical execution plan.</p>
              </div>
              <div className="rounded-xl border border-white/15 p-5">
                <Calendar className="text-newton-red" />
                <h3 className="mt-3 font-semibold">Timeline Forecasting</h3>
                <p className="mt-2 text-sm text-white/70">Get realistic process timelines with risks, dependencies, and milestone sequencing.</p>
              </div>
              <div className="rounded-xl border border-white/15 p-5">
                <Newspaper className="text-newton-red" />
                <h3 className="mt-3 font-semibold">Policy-Aware Strategy</h3>
                <p className="mt-2 text-sm text-white/70">Stay aligned with draw trends and policy updates through ongoing advisory support.</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </>
  );
}
