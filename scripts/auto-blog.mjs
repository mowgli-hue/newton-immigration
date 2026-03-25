import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "apps", "jungle-labs-web", "content", "blog");

const TOPICS = [
  {
    title: "How to Improve CLB French Speaking Score Fast for Canadian Immigration",
    keywords: ["clb french speaking practice", "french for canadian immigration", "tef preparation", "franco app"]
  },
  {
    title: "Best Daily French Practice Routine for Busy Immigration Applicants",
    keywords: ["daily french practice", "learn french for canada", "clb test prep", "french speaking drills"]
  },
  {
    title: "Franco App vs Traditional French Courses for CLB and TEF Goals",
    keywords: ["best app to learn french", "french clb preparation", "tef speaking practice", "franco app review"]
  },
  {
    title: "AI Automation Agents for Language Learning: What Actually Improves Results",
    keywords: ["ai automation agents", "ai french tutor", "personalized learning path", "french pronunciation ai"]
  },
  {
    title: "How Newton Immigration and Jungle Labs Build a Smarter French Success Path",
    keywords: ["newton immigration", "jungle labs", "french immigration coaching", "clb roadmap"]
  },
  {
    title: "Business AI Automation Systems: CRM, Analytics, and Workflow Orchestration",
    keywords: ["ai automation systems", "custom crm systems", "business analytics platform", "workflow automation"]
  },
  {
    title: "Restaurant Table Ordering System: Reducing Wait Time and Increasing Repeat Visits",
    keywords: ["restaurant table ordering system", "tablet ordering app", "restaurant operations analytics", "digital ordering"]
  },
  {
    title: "How to Build an Analytics Dashboard That Connects Budget to Revenue",
    keywords: ["business budget analytics", "marketing spend dashboard", "revenue analytics", "decision intelligence"]
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

function safeFrontmatterValue(value) {
  return String(value ?? "")
    .replace(/"/g, '\\"')
    .trim();
}

async function generateBody(topic) {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    return [
      "## Why This Topic Matters",
      `Teams searching for ${topic.keywords[0]} usually need a practical system, not generic advice.`,
      "## Practical Framework",
      "- Define current bottlenecks and baseline metrics",
      "- Run focused weekly implementation sprints",
      "- Measure score improvement with clear milestones",
      "- Optimize based on real learner or customer behavior",
      "## Recommended Internal Resources",
      "- [Learn French with Franco](/learn-french)",
      "- [Best App to Learn French](/best-app-to-learn-french)",
      "- [Jungle Labs Services](/services)",
      "## FAQ",
      "### How long before results improve?",
      "Most teams and learners see directional improvement in 2 to 4 weeks with consistent daily practice.",
      "### Is this better than random practice?",
      "Yes. Structured feedback loops and measurable progression beat unstructured repetition.",
      "## Final Takeaway",
      "Reliable progress comes from a clear system, daily execution, and weekly optimization."
    ].join("\n\n");
  }

  const prompt = `Write a clear SEO blog post for Jungle Labs.
Title: ${topic.title}
Primary keyword: ${topic.keywords[0]}
Secondary keywords: ${topic.keywords.slice(1).join(", ")}

Requirements:
- 900-1200 words
- practical, non-hype tone
- include strong H2/H3 structure
- include bullet points and a short FAQ section
- include one section connecting to Franco where relevant
- include these internal links naturally:
  - [Learn French with Franco](/learn-french)
  - [Best App to Learn French](/best-app-to-learn-french)
  - [Jungle Labs Services](/services)
  - [More AI Insights](/blog)
- no markdown frontmatter
- return markdown only`;

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
  readExistingSlugs();

  const date = new Date();
  const dayIndex = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
  const selected = TOPICS[dayIndex % TOPICS.length];
  const slug = `${toDateString(date)}-${slugify(selected.title)}`;
  const filePath = path.join(BLOG_DIR, `${slug}.md`);

  if (fs.existsSync(filePath)) {
    console.log(`Post already exists for today: ${filePath}`);
    return;
  }

  const body = await generateBody(selected);
  const frontmatter = [
    "---",
    `title: ${safeFrontmatterValue(selected.title)}`,
    `description: ${safeFrontmatterValue(
      `${selected.title}. Practical strategy from Jungle Labs with Franco-focused execution guidance.`
    )}`,
    `date: ${toDateString(date)}`,
    "author: Jungle Labs",
    `tags: ${safeFrontmatterValue(selected.keywords.join(","))}`,
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
