"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqs } from "@/lib/site-data";

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="glass-card rounded-2xl p-6 shadow-glass">
      <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
      <div className="mt-4 space-y-3">
        {faqs.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <article key={item.q} className="rounded-lg border border-white/10 bg-black/15">
              <button
                onClick={() => setOpen(isOpen ? null : idx)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-newton-dark">{item.q}</span>
                <ChevronDown className={`h-4 w-4 text-newton-red transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen ? <p className="px-4 pb-4 text-sm text-newton-dark/75">{item.a}</p> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
