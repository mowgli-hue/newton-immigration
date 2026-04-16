"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function AiAssistantPanel({ caseId, caseItem }: { caseId: string; caseItem: any }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: `Hi! I can help you with ${caseItem.client}'s ${caseItem.formType} application. What do you need?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/cases/" + caseId + "/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.text }))
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply || data.error || "Error" }]);
    } catch { setMessages(prev => [...prev, { role: "assistant", text: "Connection error." }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] max-h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${m.role === "user" ? "bg-slate-700 text-white" : "bg-emerald-500 text-white"}`}>
              {m.role === "user" ? "N" : "AI"}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-slate-700 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="flex gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">AI</div><div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-400">Thinking...</div></div>}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-3">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask about this case..." className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
        <button onClick={send} disabled={loading || !input.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Send</button>
      </div>
    </div>
  );
}
// Thu 16 Apr 2026 15:41:08 PDT
