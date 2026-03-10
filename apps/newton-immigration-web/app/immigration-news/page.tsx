import type { Metadata } from "next";
import { NewsFeed } from "@/components/news-feed";
import type { ImmigrationNewsItem } from "@/lib/news";
import { getLatestImmigrationNews } from "@/lib/news";
import { newsItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Canada Immigration News | Express Entry & IRCC Updates",
  description:
    "Live immigration updates from official sources with Express Entry draw coverage, IRCC policy changes, PNP news, and work permit updates.",
  keywords: [
    "Express Entry latest draw",
    "IRCC news",
    "Canada immigration updates",
    "PNP draw updates",
    "work permit news"
  ]
};

export default async function ImmigrationNewsPage() {
  const liveNews = await getLatestImmigrationNews();

  const displayNews: ImmigrationNewsItem[] = liveNews.length
    ? liveNews
    : newsItems.map((item) => ({
        ...item,
        category: item.category as ImmigrationNewsItem["category"],
        url: "https://www.canada.ca/en/immigration-refugees-citizenship/news.html",
        publishedAt: new Date().toISOString(),
        source: "Newton Immigration"
      }));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Canada Immigration News",
    about: "Express Entry draw updates and IRCC policy changes",
    mainEntity: displayNews.slice(0, 8).map((item) => ({
      "@type": "NewsArticle",
      headline: item.title,
      datePublished: item.publishedAt,
      description: item.text,
      publisher: {
        "@type": "Organization",
        name: item.source
      },
      url: item.url
    }))
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <h1 className="text-3xl font-semibold">Immigration News</h1>
      <p className="mt-3 text-sm text-newton-dark/75">Track Express Entry draws, policy updates, PNP activity, and work permit changes from official and verified feeds.</p>
      <p className="mt-1 text-xs text-newton-dark/60">Live feed refreshes automatically. Last checked: {new Date().toLocaleString()}</p>

      <div className="mt-6">
        <NewsFeed initialItems={displayNews} />
      </div>
    </section>
  );
}
