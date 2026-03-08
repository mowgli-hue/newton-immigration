import { Cpu, Database, Globe, Smartphone } from "lucide-react";

export function SystemBlueprintIllustration() {
  return (
    <div className="glass-card relative overflow-hidden p-6">
      <div className="absolute -left-8 -top-10 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

      <svg viewBox="0 0 520 300" className="relative z-10 h-auto w-full" aria-label="System blueprint">
        <defs>
          <linearGradient id="bpLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <rect x="210" y="115" width="110" height="70" rx="14" fill="rgba(3,10,18,0.9)" stroke="rgba(56,189,248,0.4)" />
        <line x1="265" y1="115" x2="110" y2="70" stroke="url(#bpLine)" strokeWidth="1.3" />
        <line x1="320" y1="150" x2="430" y2="80" stroke="url(#bpLine)" strokeWidth="1.3" />
        <line x1="265" y1="185" x2="125" y2="250" stroke="url(#bpLine)" strokeWidth="1.3" />
        <line x1="320" y1="170" x2="430" y2="240" stroke="url(#bpLine)" strokeWidth="1.3" />
        <rect x="60" y="44" width="100" height="52" rx="12" fill="rgba(3,10,18,0.8)" stroke="rgba(52,211,153,0.45)" />
        <rect x="375" y="50" width="100" height="52" rx="12" fill="rgba(3,10,18,0.8)" stroke="rgba(56,189,248,0.45)" />
        <rect x="70" y="225" width="110" height="52" rx="12" fill="rgba(3,10,18,0.8)" stroke="rgba(56,189,248,0.45)" />
        <rect x="375" y="215" width="110" height="52" rx="12" fill="rgba(3,10,18,0.8)" stroke="rgba(52,211,153,0.45)" />
      </svg>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 text-xs text-white/75">
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><Cpu className="h-3.5 w-3.5 text-emerald-300" /> AI Engine</div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><Database className="h-3.5 w-3.5 text-cyan-300" /> Data Layer</div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><Globe className="h-3.5 w-3.5 text-cyan-300" /> Web Apps</div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><Smartphone className="h-3.5 w-3.5 text-emerald-300" /> Mobile Apps</div>
      </div>
    </div>
  );
}
