"use client";

import { MessageCircle } from "lucide-react";

import { trackEvent } from "../lib/analytics";

export function ChatbotFab() {
  return (
    <a
      href="#ai-demo"
      onClick={() => trackEvent("chatbot_fab_click", { placement: "sticky_fab" })}
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-black/70 px-4 py-2.5 text-sm font-semibold text-cyan-100 shadow-[0_8px_30px_rgba(56,189,248,0.35)] backdrop-blur-xl transition hover:border-cyan-300/55 hover:text-white"
    >
      <MessageCircle className="h-4 w-4" />
      Use AI Chatbot
    </a>
  );
}
