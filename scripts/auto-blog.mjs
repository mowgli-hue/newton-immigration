import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "apps", "jungle-labs-web", "content", "blog");

const TOPICS = [
  {
    title: "How AI Automation Reduces Operational Costs for Service Businesses",
    keywords: ["ai automation", "operations", "cost reduction", "workflow"]
  },
  {
    title: "Practical CRM Architecture for Growing Teams",
    keywords: ["crm", "sales workflow", "customer lifecycle", "automation"]
  },
  {
    title: "Restaurant Tablet Ordering: What to Measure After Launch",
    keywords: ["restaurant tech", "tablet ordering", "kds", "service speed"]
  },
  {
    title: "Budget Intelligence: Connecting Marketing Spend to Revenue Outcomes",
    keywords: ["budget analytics", "marketing roi", "business intelligence", "forecasting"]
  }
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function readExistingSlugs() {
  if (!fs.existsSync(BLOG_DIR)) return new Set();
  return new Set(fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".md")).map((file) => file.replace(/\.md$/, "")));
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

async function generateBody(topic) {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    return [
      "## Why This Topic Matters",
      `Businesses looking at ${topic.keywords[0]} often hit execution gaps between planning and delivery.`,
      "## Jungle Labs Implementation Perspective",
      "We focus on practical deployment: integration, automation logic, reporting, and measurable outcomes.",
      "## Recommended Execution Steps",
      "- Audit current process and data flow",
      "- Identify high-friction handoffs",
      "- Deploy automation in phased milestones",
      "- Measure impact weekly and optimize continuously",
      "## Conclusion",
      "Consistent systems outperform one-off tactics. A strong technical foundation compounds business growth."
    ].join("\n\n");
  }

  const prompt = `Write a clear SEO blog post for Jungle Labs.\nTitle: ${topic.title}\nKeywords: ${topic.keywords.join(", ")}\nRequirements:\n- 700-900 words\n- practical, non-hype tone\n- headings and bullet points\n- focus on business outcomes\n- no markdown frontmatter\n- return markdown only`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("No content returned from OpenAI");
  return text;
}

async function run() {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  const existingSlugs = readExistingSlugs();

  const selected =
    TOPICS.find((topic) => {
      const baseSlug = slugify(topic.title);
      return !Array.from(existingSlugs).some((slug) => slug.includes(baseSlug));
    }) || TOPICS[0];

  const date = new Date();
  const slug = `${toDateString(date)}-${slugify(selected.title)}`;
  const filePath = path.join(BLOG_DIR, `${slug}.md`);

  if (fs.existsSync(filePath)) {
    console.log(`Post already exists for today: ${filePath}`);
    return;
  }

  const body = await generateBody(selected);
  const frontmatter = [
    "---",
    `title: ${selected.title}`,
    `description: ${selected.title}. A practical execution guide from Jungle Labs.`,
    `date: ${toDateString(date)}`,
    "author: Jungle Labs",
    `tags: ${selected.keywords.join(",")}`,
    "---",
    ""
  ].join("\n");

  fs.writeFileSync(filePath, `${frontmatter}${body}\n`, "utf8");
  console.log(`Created blog post: ${filePath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
