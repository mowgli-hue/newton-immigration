"use client";

import { motion } from "framer-motion";
import { Bot, SendHorizonal, User } from "lucide-react";
import { useMemo, useState } from "react";

import { AnimatedSection } from "./AnimatedSection";
import { demoSuggestions } from "../lib/content";
import { trackEvent } from "../lib/analytics";

type Message = {
  role: "user" | "assistant";
  text: string;
};

const responses: Record<string, string> = {
  "automate my business":
    "We map your highest-cost manual workflow, design an automation architecture, and deploy phased AI agents with approval-safe actions.",
  "build a crm system":
    "We define your pipeline stages, client lifecycle, and team permissions, then ship a custom CRM aligned to your exact operations.",
  "create analytics dashboard":
    "We build a live metrics layer with KPI trees, budget-to-revenue visibility, and executive-ready decision views."
};

function resolveReply(input: string) {
  const key = input.trim().toLowerCase();
  return (
    responses[key] ??
    "Jungle Labs can turn that into a scoped build plan. We start with discovery, define architecture, then launch an execution-ready MVP in focused milestones."
  );
}

export function AIDemoSection() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Describe your business challenge. I will suggest a practical system plan you can deploy."
    }
  ]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const latestUserPrompt = useMemo(
    () => [...messages].reverse().find((message) => message.role === "user")?.text ?? "",
    [messages]
  );

  const submit = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    trackEvent("ai_demo_prompt_submit", { prompt: clean.slice(0, 60) });

    setMessages((prev) => [...prev, { role: "user", text: clean }, { role: "assistant", text: resolveReply(clean) }]);
    setInput("");
  };

  const submitLead = async () => {
    if (!name || !email || !latestUserPrompt) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const params = new URLSearchParams(window.location.search);

      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          company,
          challenge: latestUserPrompt,
          utm_source: params.get("utm_source") || "",
          utm_medium: params.get("utm_medium") || "",
          utm_campaign: params.get("utm_campaign") || "",
          page: window.location.pathname
        })
      });

      if (!response.ok) throw new Error("Failed");

      setStatus("success");
      trackEvent("lead_form_submit", { source: "chatbot" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <AnimatedSection id="ai-demo" className="section-shell mt-24">
      <div className="mb-8 max-w-3xl">
        <p className="section-kicker">Interactive AI Demo</p>
        <h2 className="section-title">Use the chatbot to get a build plan, then send it to your inbox</h2>
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
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:from-emerald-200 hover:to-cyan-200"
          >
            Send
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>

        {latestUserPrompt ? (
          <div className="mt-6 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 md:p-5">
            <p className="text-sm font-semibold text-emerald-100">Get this AI build plan in your inbox</p>
            <p className="mt-1 text-sm text-emerald-50/85">
              Add your details and our team will send a refined project scope with implementation steps.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="rounded-xl border border-white/20 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-emerald-300/55"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Work email"
                className="rounded-xl border border-white/20 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-emerald-300/55"
              />
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Company (optional)"
                className="rounded-xl border border-white/20 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-emerald-300/55"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={submitLead}
                disabled={status === "loading"}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-100 disabled:opacity-60"
              >
                {status === "loading" ? "Submitting..." : "Send My Plan"}
              </button>
              {status === "success" ? <span className="text-sm text-emerald-100">Thanks. We received your request.</span> : null}
              {status === "error" ? <span className="text-sm text-rose-200">Please complete required fields and retry.</span> : null}
            </div>
          </div>
        ) : null}
      </div>
    </AnimatedSection>
  );
}
