"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { navLinks } from "../lib/content";
import { trackEvent } from "../lib/analytics";

export function Navbar() {
  return (
    <header className="sticky top-4 z-50 section-shell">
      <nav className="mt-4 flex items-center justify-between rounded-full border border-white/10 bg-black/45 px-5 py-3 backdrop-blur-xl">
        <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-white">
          <Sparkles className="h-4 w-4 text-emerald-300" />
          Jungle Labs
        </Link>

        <div className="hidden items-center gap-6 text-sm text-white/75 md:flex">
          {navLinks.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-cyan-300">
              {item.label}
            </a>
          ))}
          <Link href="/services" className="transition hover:text-cyan-300">
            Services Page
          </Link>
        </div>

        <a
          href="#contact"
          onClick={() => trackEvent("start_project_click", { placement: "navbar" })}
          className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200 transition hover:bg-emerald-400/20"
        >
          Start a Project
        </a>
      </nav>
    </header>
  );
}
