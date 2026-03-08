"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { navLinks } from "../lib/content";
import { trackEvent } from "../lib/analytics";

export function Navbar() {
  return (
    <header className="sticky top-4 z-50 section-shell">
      <nav className="mt-4 flex items-center justify-between rounded-full border border-cyan-300/15 bg-black/55 px-5 py-3 backdrop-blur-xl">
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
          className="rounded-full border border-emerald-300/35 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:from-emerald-400/30 hover:to-cyan-400/30"
        >
          Start a Project
        </a>
      </nav>
    </header>
  );
}
