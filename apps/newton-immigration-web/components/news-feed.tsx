"use client";

import { useEffect, useMemo, useState } from "react";
import type { ImmigrationNewsItem } from "@/lib/news";

export function NewsFeed({ initialItems }: { initialItems: ImmigrationNewsItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => `${item.title} ${item.text} ${item.category}`.toLowerCase().includes(needle));
  }, [items, query]);

  const refresh = async () => {
    setStatus("Refreshing...");
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      if (!res.ok) {
        setStatus("Unable to refresh right now.");
        return;
      }
      const data = (await res.json()) as { items?: ImmigrationNewsItem[] };
      if (data.items?.length) {
        setItems(data.items);
      }
      setStatus(`Updated at ${new Date().toLocaleTimeString()}`);
    } catch {
      setStatus("Unable to refresh right now.");
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      void refresh();
    }, 10 * 60 * 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search: recent Express Entry draw, IRCC policy, PNP..."
          className="rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-newton-dark outline-none focus:border-newton-red"
        />
        <button onClick={refresh} className="rounded-lg bg-newton-red px-4 py-2.5 text-sm font-semibold text-white">
          Refresh News
        </button>
      </div>
      {status ? <p className="mb-4 text-xs text-newton-dark/60">{status}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((item) => (
          <article key={`${item.title}-${item.publishedAt}`} className="glass-card rounded-xl p-5 shadow-glass">
            <p className="text-xs font-semibold uppercase text-newton-red">{item.category}</p>
            <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-newton-dark/75">{item.text}</p>
            <p className="mt-2 text-xs text-newton-dark/60">Source: {item.source}</p>
            <a href={item.url} target="_blank" className="mt-3 inline-block text-sm font-semibold text-newton-red">
              Open official update
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
