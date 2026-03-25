import fs from "node:fs";
import path from "node:path";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  content: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Invalid markdown frontmatter format");
  }

  const [, frontmatter, content] = match;
  const fields: Record<string, string> = {};

  for (const line of frontmatter.split("\n")) {
    const [key, ...rest] = line.split(":");
    fields[key.trim()] = rest.join(":").trim();
  }

  return { fields, content: content.trim() };
}

function markdownToHtml(markdown: string) {
  return markdown
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-100">$1</a>'
    )
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<(h2|h3|ul|li|\/ul|\/li|p|\/p))(.*)$/gm, "<p>$2</p>")
    .replace(/<p><\/p>/g, "");
}

export function getAllBlogPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".md"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { fields, content } = parseFrontmatter(raw);
      return {
        slug: file.replace(/\.md$/, ""),
        title: fields.title,
        description: fields.description,
        date: fields.date,
        author: fields.author || "Jungle Labs",
        tags: (fields.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
        content
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const posts = getAllBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export function getBlogHtml(slug: string): string | null {
  const post = getBlogPostBySlug(slug);
  if (!post) return null;
  return markdownToHtml(post.content);
}
