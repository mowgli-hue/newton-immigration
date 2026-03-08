"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageSquareText } from "lucide-react";

import { AnimatedSection } from "./AnimatedSection";
import { trackEvent } from "../lib/analytics";

export function LeadIntentSection() {
  return (
    <AnimatedSection className="section-shell mt-16">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card relative overflow-hidden p-6 md:p-8"
      >
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/18 blur-3xl" />
        <div className="absolute -left-10 -bottom-20 h-52 w-52 rounded-full bg-emerald-300/14 blur-3xl" />

        <div className="relative grid gap-5 md:grid-cols-[1.25fr_0.75fr] md:items-center">
          <div>
            <p className="section-kicker">For Paid Traffic</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Get an AI-generated system plan in under 2 minutes
            </h2>
            <p className="mt-3 max-w-2xl text-white/75">
              Perfect for founders from ads: describe your business challenge, get a scoped build approach, and send it
              to your inbox instantly.
            </p>
          </div>
          <a
            href="#ai-demo"
            onClick={() => trackEvent("chatbot_primary_cta_click", { placement: "lead_intent_strip" })}
            className="inline-flex h-fit items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 px-6 py-3 text-sm font-semibold text-black transition hover:from-emerald-200 hover:to-cyan-200"
          >
            <MessageSquareText className="h-4 w-4" />
            Use AI Chatbot
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </AnimatedSection>
  );
}
