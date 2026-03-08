"use client";

import { motion } from "framer-motion";

const items = [
  "AI Automation",
  "Custom CRM",
  "Analytics Infrastructure",
  "Lead Generation Systems",
  "Mobile + Web Platforms",
  "Business Intelligence"
];

export function MotionRibbon() {
  const looped = [...items, ...items];

  return (
    <section className="section-shell mt-8">
      <div className="glass-card overflow-hidden py-3">
        <motion.div
          className="flex min-w-max gap-3 px-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        >
          {looped.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-cyan-100"
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
