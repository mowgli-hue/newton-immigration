"use client";

import { motion } from "framer-motion";

import { AnimatedSection } from "./AnimatedSection";
import { roadmap } from "../lib/content";

export function RoadmapSection() {
  return (
    <AnimatedSection className="section-shell mt-24">
      <div className="mb-8 max-w-3xl">
        <p className="section-kicker">Product Roadmap</p>
        <h2 className="section-title">A clear timeline for Jungle Labs products</h2>
      </div>

      <div className="relative space-y-6 pl-6 before:absolute before:bottom-3 before:left-1.5 before:top-3 before:w-px before:bg-gradient-to-b before:from-emerald-300/60 before:to-cyan-300/20">
        {roadmap.map((item, index) => (
          <motion.article
            key={item.year}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.72, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card relative p-6"
          >
            <span className="absolute -left-[30px] top-8 h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
            <div className="text-xs font-semibold uppercase tracking-[0.13em] text-cyan-200">{item.year}</div>
            <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-2 leading-relaxed text-white/70">{item.detail}</p>
          </motion.article>
        ))}
      </div>
    </AnimatedSection>
  );
}
