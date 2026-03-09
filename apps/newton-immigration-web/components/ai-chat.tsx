"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { advisorQuickQuestions } from "@/lib/site-data";

type ChatMessage = { role: "user" | "ai"; text: string };

export function AIAdvisorChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Welcome to Newton Immigration AI Advisor. Ask about PR, PNP, or CEC pathways." }
  ]);
  const [askedCount, setAskedCount] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  const sendQuestion = async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsThinking(true);

    const response = await fetch("/api/ai-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text, count: askedCount + 1 })
    });

    const data = (await response.json()) as { answer: string };
    await new Promise((resolve) => setTimeout(resolve, 400));

    setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    setAskedCount((v) => v + 1);
    setIsThinking(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const text = question.trim();
    setQuestion("");
    await sendQuestion(text);
  };

  return (
    <div className="glass-card rounded-2xl p-5 shadow-glass">
      <h3 className="text-lg font-semibold">Newton Immigration AI Advisor</h3>
      <div className="mt-4 h-80 space-y-3 overflow-y-auto rounded-lg border border-black/10 bg-white/70 p-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "ml-auto bg-newton-red text-white" : "bg-white text-newton-dark"}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {advisorQuickQuestions.map((q) => (
          <button key={q} onClick={() => sendQuestion(q)} className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs text-newton-dark/85 hover:border-newton-red/40">
            {q}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Can I apply for PR with CRS 460?"
          className="flex-1 rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-newton-red"
        />
        <button type="submit" className="rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white">
          Ask
        </button>
      </form>
      {isThinking ? <p className="mt-2 text-xs text-newton-dark/60">Newton AI Advisor is analyzing your question...</p> : null}

      {askedCount >= 3 ? (
        <div className="mt-4 rounded-lg border border-newton-red/30 bg-red-50 p-3 text-sm">
          <p className="font-semibold text-newton-dark">Speak with a Newton Immigration Consultant.</p>
          <Link href="/consultation" className="mt-2 inline-block font-semibold text-newton-red">Book Consultation</Link>
        </div>
      ) : null}
    </div>
  );
}
