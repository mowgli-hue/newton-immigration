"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/crs-calculator", label: "CRS Calculator" },
  { href: "/immigration-news", label: "Immigration News" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Logo />

        <button className="inline-flex rounded-md border border-black/10 p-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          <Menu size={18} />
        </button>

        <nav className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition ${pathname === link.href ? "text-newton-red" : "text-newton-dark/80 hover:text-newton-red"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/assessment" className="rounded-md border border-newton-red px-3 py-2 text-sm font-medium text-newton-red transition hover:bg-newton-red hover:text-white">
            Free Assessment
          </Link>
          <Link href="/consultation" className="rounded-md bg-newton-red px-3 py-2 text-sm font-medium text-white transition hover:bg-newton-accent">
            Book Consultation
          </Link>
        </div>
      </div>

      {open ? (
        <div className="border-t border-black/10 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm text-newton-dark/90">
                {link.label}
              </Link>
            ))}
            <Link href="/assessment" className="rounded-md border border-newton-red px-3 py-2 text-center text-sm font-medium text-newton-red">
              Free Assessment
            </Link>
            <Link href="/consultation" className="rounded-md bg-newton-red px-3 py-2 text-center text-sm font-medium text-white">
              Book Consultation
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
