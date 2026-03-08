"use client";

import { motion } from "framer-motion";
import { Clock3, Rocket } from "lucide-react";

import { AnimatedSection } from "./AnimatedSection";
import { products } from "../lib/content";

export function ProductsSection() {
  return (
    <AnimatedSection id="products" className="section-shell mt-24">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="section-kicker">Products</p>
          <h2 className="section-title">Purpose-built products from Jungle Labs</h2>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {products.map((product, index) => (
          <motion.article
            key={product.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, scale: 1.008 }}
            className="glass-card group overflow-hidden p-7"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 opacity-60" />
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-cyan-200">
              {product.badge}
            </span>
            <h3 className="mt-4 text-3xl font-semibold text-white">{product.name}</h3>
            <p className="mt-2 text-sm uppercase tracking-[0.1em] text-emerald-200/80">{product.subtitle}</p>
            <p className="mt-4 leading-relaxed text-white/70">{product.description}</p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
              {product.status === "Live" ? <Rocket className="h-3.5 w-3.5 text-emerald-300" /> : <Clock3 className="h-3.5 w-3.5 text-sky-300" />}
              {product.status}
            </div>
          </motion.article>
        ))}
      </div>
    </AnimatedSection>
  );
}
