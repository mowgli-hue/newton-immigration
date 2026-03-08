"use client";

import { motion } from "framer-motion";
import { Bot, SendHorizonal, User } from "lucide-react";
import { useState } from "react";

import { AnimatedSection } from "./AnimatedSection";
import { demoSuggestions } from "../lib/content";
import { trackEvent } from "../lib/analytics";

type Message = {
  role: "user" | "assistant";
  text: string;
};

const responses: Record<string, string> = {
  "automate my business":
    "We map your high-friction workflows, design an AI automation layer, and deploy approval-safe actions across your tools in phased sprints.",
  "build a crm system":
    "We architect a custom CRM for your pipeline, client lifecycle, and reporting needs with role-based dashboards and integration with communication channels.",
  "create analytics dashboard":
    "We build a live metrics command center with KPI modeling, cohort trends, and alerting so your team can act on insights in real time."
};

function resolveReply(input: string) {
  const key = input.trim().toLowerCase();
  return (
    responses[key] ??
    "Jungle Labs can turn that into a scoped build plan. We typically start with discovery, define architecture, and ship an MVP in focused milestones."
  );
}

export function AIDemoSection() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "I am Jungle Labs AI. Ask me what system you want to build and I will show how we can execute it."
    }
  ]);

  const submit = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    trackEvent("ai_demo_prompt_submit", { prompt: clean.slice(0, 60) });

    setMessages((prev) => [
      ...prev,
      { role: "user", text: clean },
      { role: "assistant", text: resolveReply(clean) }
    ]);
    setInput("");
  };

  return (
    <AnimatedSection className="section-shell mt-24">
      <div className="mb-8 max-w-3xl">
        <p className="section-kicker">Interactive AI Demo</p>
        <h2 className="section-title">Try a chatbot-style system planning experience</h2>
      </div>

      <div className="glass-card p-5 md:p-7">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4 md:p-5">
          {messages.map((message, index) => (
            <motion.div
              key={`${message.role}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <span className="mt-0.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 p-1.5 text-cyan-200">
                  <Bot className="h-4 w-4" />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "border border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                    : "border border-white/10 bg-white/5 text-white/80"
                }`}
              >
                {message.text}
              </div>
              {message.role === "user" && (
                <span className="mt-0.5 rounded-full border border-emerald-300/30 bg-emerald-300/10 p-1.5 text-emerald-200">
                  <User className="h-4 w-4" />
                </span>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {demoSuggestions.map((prompt) => (
            <button
              key={prompt}
              onClick={() => submit(prompt)}
              className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit(input);
            }}
            placeholder="Type your prompt..."
            className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-cyan-300/50"
          />
          <button
            onClick={() => submit(input)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Send
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AnimatedSection>
  );
}
