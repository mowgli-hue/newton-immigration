"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

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

      <div className="grid gap-6 lg:grid-cols-3">
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
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-cyan-200">
                {product.badge}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.09em] text-white/75">
                <Sparkles className="h-3 w-3 text-emerald-300" />
                {product.status}
              </span>
            </div>
            <h3 className="mt-4 text-3xl font-semibold text-white">{product.name}</h3>
            <p className="mt-2 text-sm uppercase tracking-[0.1em] text-emerald-200/80">{product.subtitle}</p>
            <p className="mt-4 leading-relaxed text-white/70">{product.description}</p>
            <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
              {product.highlights.map((highlight) => (
                <div key={highlight} className="text-sm text-cyan-100/80">
                  {`> ${highlight}`}
                </div>
              ))}
            </div>
            {product.href ? (
              <a
                href={product.href}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-200 transition hover:text-cyan-100"
              >
                Visit Product Site
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : null}
          </motion.article>
        ))}
      </div>
    </AnimatedSection>
  );
}
