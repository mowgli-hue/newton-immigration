"use client";

import { motion } from "framer-motion";
import { ArrowRight, Cpu, ShieldCheck, Zap } from "lucide-react";

import { AnimatedCounter } from "./AnimatedCounter";
import { ParticleField } from "./ParticleField";
import { trackEvent } from "../lib/analytics";

const nodes = [
  { left: "15%", top: "24%" },
  { left: "40%", top: "16%" },
  { left: "64%", top: "26%" },
  { left: "24%", top: "54%" },
  { left: "52%", top: "46%" },
  { left: "75%", top: "60%" }
];

export function HeroSection() {
  return (
    <section className="section-shell relative pt-20 md:pt-28">
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-gradient-to-br from-cyan-400/8 via-black to-emerald-400/5" />
      <ParticleField />

      <div className="relative grid items-center gap-10 px-6 py-14 md:px-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">
            AI Infrastructure Studio
          </span>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
            Building Intelligent Digital Systems for Modern Businesses
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            Jungle Labs designs AI automation, software platforms, analytics engines, and digital infrastructure that help
            teams move faster and operate with precision.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#services"
              onClick={() => trackEvent("explore_solutions_click", { placement: "hero" })}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 px-6 py-3 text-sm font-semibold text-black transition hover:from-emerald-200 hover:to-cyan-200"
            >
              Explore Solutions
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#contact"
              onClick={() => trackEvent("start_project_click", { placement: "hero" })}
              className="rounded-full border border-cyan-300/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/50 hover:text-cyan-200"
            >
              Start a Project
            </a>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-4 pt-2">
            <div className="glass-card p-4">
              <div className="text-2xl font-semibold text-emerald-300"><AnimatedCounter value={97} suffix="%" /></div>
              <div className="mt-1 text-xs uppercase tracking-[0.1em] text-white/50">Automation accuracy</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-semibold text-cyan-300"><AnimatedCounter value={52} suffix="%" /></div>
              <div className="mt-1 text-xs uppercase tracking-[0.1em] text-white/50">Faster cycle time</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-semibold text-sky-300"><AnimatedCounter value={31} suffix="%" /></div>
              <div className="mt-1 text-xs uppercase tracking-[0.1em] text-white/50">Avg. ROI uplift</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.18, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="glass-card relative min-h-[360px] overflow-hidden p-6 md:min-h-[430px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 380" fill="none" aria-hidden="true">
              <motion.path
                d="M80 95 L205 70 L325 108 L180 210 L265 190 L390 240"
                stroke="url(#lineGradient)"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0.2 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.8, repeat: Infinity, repeatType: "loop", ease: "linear" }}
              />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>

            {nodes.map((node, index) => (
              <motion.span
                key={index}
                className="absolute h-3 w-3 rounded-full bg-emerald-300"
                style={{ left: node.left, top: node.top, boxShadow: "0 0 20px rgba(52, 211, 153, 0.75)" }}
                animate={{ scale: [1, 1.7, 1], opacity: [0.45, 1, 0.45] }}
                transition={{ repeat: Infinity, duration: 3.5, delay: index * 0.24 }}
              />
            ))}

            <div className="relative z-10 mt-auto grid gap-3 pt-60 md:pt-72">
              <div className="glass-card flex items-center gap-3 p-3">
                <Cpu className="h-4 w-4 text-cyan-300" />
                <span className="text-sm text-white/80">AI Orchestration Layer Active</span>
              </div>
              <div className="glass-card flex items-center gap-3 p-3">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <span className="text-sm text-white/80">Secure Data Pipelines Online</span>
              </div>
              <div className="glass-card flex items-center gap-3 p-3">
                <Zap className="h-4 w-4 text-sky-300" />
                <span className="text-sm text-white/80">Realtime Event Automation Running</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
