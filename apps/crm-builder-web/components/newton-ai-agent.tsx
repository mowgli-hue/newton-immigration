"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
  time?: string;
}

const QUICK_ACTIONS = [
  { icon: "📰", label: "Immigration News", prompt: "What are the latest IRCC news and policy updates this week? Include processing time changes, new programs, and anything affecting Canadian immigration applications." },
  { icon: "🚨", label: "Urgent Cases", prompt: "ANALYZE_CASES: Review all active cases and identify: 1) Permits expiring within 30 days 2) Cases with missing critical documents 3) Cases overdue for follow-up 4) Any urgent matters needing immediate attention" },
  { icon: "✉️", label: "Draft LOE", prompt: "Help me draft a Letter of Explanation. What is it for? (refusal, gap in employment, travel history, etc.)" },
  { icon: "📋", label: "Doc Checklist", prompt: "Generate a complete document checklist for which application type?" },
  { icon: "📊", label: "Case Summary", prompt: "ANALYZE_CASES: Give me a summary of all active cases — how many per form type, which are urgent, which need attention today" },
  { icon: "💬", label: "Client Message", prompt: "Draft a WhatsApp message to a client. What do you need to communicate?" },
];

export function NewtonAiAgent({ cases, user }: { cases: any[]; user: any }) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      text: `Hello ${user?.name?.split(" ")[0] || ""}! 👋 I'm Newton, your immigration AI assistant.\n\nI can help you with:\n📰 Latest IRCC news & policy updates\n🚨 Case analysis & urgent flags\n✉️ Letters of explanation & cover letters\n📋 Document checklists\n💬 Client messages in English & Punjabi\n📊 Case summaries & insights\n\nWhat do you need today?`,
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

    // Build full case context
    const caseContext = cases.slice(0, 50).map(c => {
      const intake = c.pgwpIntake || {};
      const permitExpiry = intake.studyPermitExpiryDate || intake.workPermitExpiryDate || c.permitExpiryDate || "";
      const daysUntilExpiry = permitExpiry ? Math.floor((new Date(permitExpiry).getTime() - Date.now()) / 86400000) : null;
      return `${c.id}: ${c.client} | ${c.formType} | Status: ${c.processingStatus || "docs_pending"} | Assigned: ${c.assignedTo || "unassigned"} | Urgent: ${c.isUrgent ? "YES" : "no"}${daysUntilExpiry !== null ? ` | Permit expires: ${permitExpiry} (${daysUntilExpiry} days)` : ""}`;
    }).join("\n");

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });

    try {
      const res = await fetch("/api/newton-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.text }))
        })
      });
      const data = await res.json();
      const reply = data.reply || data.error || "Sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: "assistant", text: reply, time: new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }) }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection error. Please try again.", time }]);
    } finally { setLoading(false); }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-emerald-700 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">🤖</div>
        <div>
          <div className="font-bold text-white text-sm">Newton AI</div>
          <div className="text-emerald-100 text-xs">Personal immigration assistant • {cases.length} cases loaded</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></div>
          <span className="text-emerald-100 text-xs">Online</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_ACTIONS.map((a, i) => (
            <button key={i} onClick={() => send(a.prompt)}
              className="flex items-center gap-1.5 shrink-0 text-xs bg-white border border-slate-200 text-slate-700 rounded-full px-3 py-1.5 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors font-medium">
              <span>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${m.role === "user" ? "bg-slate-600 text-white" : "bg-emerald-500 text-white"}`}>
              {m.role === "user" ? (user?.name?.[0] || "S") : "N"}
            </div>
            <div className={`max-w-[78%] flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-slate-700 text-white rounded-tr-sm" : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm"}`}>
                {m.text}
              </div>
              <div className="flex items-center gap-2 px-1">
                {m.time && <span className="text-[10px] text-slate-400">{m.time}</span>}
                {m.role === "assistant" && (
                  <button onClick={() => copyText(m.text)} className="text-[10px] text-slate-400 hover:text-slate-600">Copy</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">N</div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay:"0ms"}}></div>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay:"150ms"}}></div>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay:"300ms"}}></div>
                <span className="text-xs text-slate-400 ml-1">Newton is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask Newton anything about immigration, cases, letters..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
