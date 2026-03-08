import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { socialLinks } from "../lib/content";
import { BrandLogo } from "./BrandLogo";

export function SiteFooter() {
  const linkedIn = socialLinks.find((link) => link.name === "LinkedIn")?.href ?? "#";
  const instagram = socialLinks.find((link) => link.name === "Instagram")?.href ?? "#";
  const facebook = socialLinks.find((link) => link.name === "Facebook")?.href ?? "#";

  return (
    <footer className="section-shell mt-20 pb-10">
      <div className="rounded-3xl border border-white/10 bg-black/50 p-6 text-sm text-white/65 backdrop-blur-xl md:p-8">
        <div className="grid gap-7 md:grid-cols-3">
          <div>
            <BrandLogo width={180} height={46} className="h-10 w-auto" />
            <p className="mt-3 max-w-sm leading-relaxed">
              AI automation, software systems, and analytics infrastructure for modern businesses.
            </p>
          </div>
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-300" /> Surrey, BC, Canada</p>
            <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-cyan-300" /> admin@junglelabsworld.com</p>
            <p className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-cyan-300" /> +1 (604) 902-8699</p>
          </div>
          <div className="flex items-start gap-3 md:justify-end">
            <a aria-label="Jungle Labs LinkedIn" href={linkedIn} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 bg-white/5 p-2.5 text-white/80 transition hover:border-cyan-300/45 hover:text-cyan-200"><Linkedin className="h-4 w-4" /></a>
            <a aria-label="Jungle Labs Instagram" href={instagram} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 bg-white/5 p-2.5 text-white/80 transition hover:border-cyan-300/45 hover:text-cyan-200"><Instagram className="h-4 w-4" /></a>
            <a aria-label="Jungle Labs Facebook" href={facebook} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 bg-white/5 p-2.5 text-white/80 transition hover:border-cyan-300/45 hover:text-cyan-200"><Facebook className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
