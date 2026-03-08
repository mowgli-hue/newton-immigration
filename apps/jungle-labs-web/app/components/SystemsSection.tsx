"use client";

import { motion } from "framer-motion";

import { AnimatedSection } from "./AnimatedSection";
import { systemsWeBuild } from "../lib/content";

export function SystemsSection() {
  return (
    <AnimatedSection className="section-shell mt-24">
      <div className="mb-8 max-w-3xl">
        <p className="section-kicker">Systems We Build</p>
        <h2 className="section-title">Modular platforms for growth, automation, and insight</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {systemsWeBuild.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.68, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, boxShadow: "0 0 0 1px rgba(45,212,191,0.34), 0 26px 42px -24px rgba(45,212,191,0.3)" }}
              className="glass-card flex items-center gap-4 p-5"
            >
              <span className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-3 text-cyan-200">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
            </motion.article>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
