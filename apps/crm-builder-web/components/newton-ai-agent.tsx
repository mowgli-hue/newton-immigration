"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
  time?: string;
}

const SUGGESTIONS = [
  "What documents does a PGWP applicant need?",
  "Draft a message asking client to send passport",
  "What are the SOWP eligibility requirements?",
  "How long does a study permit extension take?",
  "What is the difference between LMIA and LMIA-exempt?",
];

export function NewtonAiAgent({ cases, user }: { cases: any[]; user: any }) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      text: `Hello ${user?.name || ""}! 👋 I'm your Newton Immigration AI assistant.\n\nI have access to all ${cases.length} active cases and can help you with:\n\n• Client questions and eligibility\n• Drafting WhatsApp messages\n• IRCC requirements and processing times\n• Case status and follow-ups\n• Document checklists\n\nWhat can I help you with today?`,
      time: new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (msg?: string) => {
    const userMsg = msg || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    const time = new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role: "user", text: userMsg, time }]);
    setLoading(true);

    // Build case context
    const recentCases = cases.slice(0, 20).map(c => 
      `${c.id}: ${c.client} (${c.formType}) - ${c.processingStatus || "docs_pending"} - assigned: ${c.assignedTo || "unassigned"}`
    ).join("\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: `You are Newton, the AI assistant for Newton Immigration — a Canadian immigration consulting firm in Surrey, BC.

You are speaking with ${user?.name || "a staff member"} (${user?.role || "staff"}).

ACTIVE CASES (${cases.length} total):
${recentCases}

Your capabilities:
- Answer Canadian immigration questions (IRCC, PGWP, SOWP, TRV, Study Permits, Work Permits, PR, Spousal Sponsorship)
- Draft professional WhatsApp messages to clients in English and Punjabi
- Explain IRCC requirements and processing times
- Help with case management and follow-ups
- Review and analyze intake answers
- Generate document checklists

Always be professional, concise and helpful. When drafting messages, format them ready to send.
If asked about a specific case, use the case data provided above.`,
          messages: [
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.text })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { 
        role: "assistant", 
        text: reply,
        time: new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection error. Please try again.", time }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">🤖</div>
        <div>
          <div className="font-bold text-white text-sm">Newton AI</div>
          <div className="text-emerald-100 text-xs">Your immigration assistant • {cases.length} active cases</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></div>
          <span className="text-emerald-100 text-xs">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${m.role === "user" ? "bg-slate-600 text-white" : "bg-emerald-500 text-white"}`}>
              {m.role === "user" ? (user?.name?.[0] || "S") : "N"}
            </div>
            <div className={`max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-slate-700 text-white rounded-tr-sm" : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm"}`}>
                {m.text}
              </div>
              {m.time && <span className="text-[10px] text-slate-400 px-1">{m.time}</span>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">N</div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay:"0ms"}}></div>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay:"150ms"}}></div>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay:"300ms"}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-slate-400 mb-2 font-medium">Quick questions</div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3 py-1 hover:bg-emerald-100 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask Newton anything..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
