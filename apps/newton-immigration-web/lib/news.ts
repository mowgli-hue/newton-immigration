export type ImmigrationNewsItem = {
  title: string;
  category: "Express Entry Draw Updates" | "IRCC policy changes" | "PNP draws" | "Work permit updates" | "General immigration updates";
  text: string;
  url: string;
  publishedAt: string;
  source: string;
};

const IRCC_NEWSROOM_ATOM =
  "https://www.canada.ca/en/immigration-refugees-citizenship/news.atom.xml";

const decodeHtml = (input: string) =>
  input
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractTag = (block: string, tag: string) => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
};

const detectCategory = (text: string): ImmigrationNewsItem["category"] => {
  const lower = text.toLowerCase();
  if (lower.includes("express entry") || lower.includes("draw")) return "Express Entry Draw Updates";
  if (lower.includes("provincial") || lower.includes("pnp")) return "PNP draws";
  if (lower.includes("work permit") || lower.includes("temporary resident")) return "Work permit updates";
  if (lower.includes("policy") || lower.includes("minister") || lower.includes("ircc")) return "IRCC policy changes";
  return "General immigration updates";
};

const parseIrccAtom = (xml: string): ImmigrationNewsItem[] => {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return entries
    .map((entry) => {
      const title = decodeHtml(extractTag(entry, "title"));
      const summary = decodeHtml(extractTag(entry, "summary"));
      const updated = decodeHtml(extractTag(entry, "updated"));
      const id = decodeHtml(extractTag(entry, "id"));
      const link = entry.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? id;
      const combinedText = `${title} ${summary}`.trim();

      return {
        title,
        category: detectCategory(combinedText),
        text: summary || "Read the official IRCC update for full details.",
        url: link,
        publishedAt: updated || new Date().toISOString(),
        source: "IRCC Newsroom (Canada.ca)"
      } as ImmigrationNewsItem;
    })
    .filter((item) => item.title && item.url)
    .slice(0, 12);
};

const fetchOfficialNews = async (): Promise<ImmigrationNewsItem[]> => {
  try {
    const res = await fetch(IRCC_NEWSROOM_ATOM, {
      next: { revalidate: 900 },
      headers: {
        "User-Agent": "NewtonImmigrationNewsBot/1.0"
      }
    });

    if (!res.ok) return [];

    const xml = await res.text();
    return parseIrccAtom(xml);
  } catch {
    return [];
  }
};

const fetchProviderNews = async (): Promise<ImmigrationNewsItem[]> => {
  const key = process.env.NEWS_API_KEY;
  const provider = process.env.NEWS_API_PROVIDER ?? "gnews";
  if (!key) return [];

  if (provider === "gnews") {
    try {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
        "Express Entry OR IRCC OR Provincial Nominee Program OR work permit"
      )}&lang=en&max=10&token=${encodeURIComponent(key)}`;

      const res = await fetch(url, { next: { revalidate: 900 } });
      if (!res.ok) return [];

      const payload = (await res.json()) as {
        articles?: Array<{
          title: string;
          description?: string;
          url: string;
          publishedAt: string;
          source?: { name?: string };
        }>;
      };

      return (payload.articles ?? []).map((article) => ({
        title: article.title,
        category: detectCategory(`${article.title} ${article.description ?? ""}`),
        text: article.description ?? "Open the article for details.",
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source?.name ?? "GNews"
      }));
    } catch {
      return [];
    }
  }

  return [];
};

export const getLatestImmigrationNews = async (): Promise<ImmigrationNewsItem[]> => {
  const [official, providerNews] = await Promise.all([fetchOfficialNews(), fetchProviderNews()]);

  const merged = [...official, ...providerNews]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter((item, index, arr) => arr.findIndex((x) => x.url === item.url) === index)
    .slice(0, 12);

  return merged;
};
