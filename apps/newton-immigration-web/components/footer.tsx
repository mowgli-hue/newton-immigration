import Link from "next/link";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import { Logo } from "@/components/logo";
import { companyInfo, locations, socialLinks } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#0a0f19] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <Logo darkText={false} />
          <p className="mt-3 text-sm text-white/70">Professional Canada immigration advisory platform with practical digital tools.</p>
          <p className="mt-3 text-xs text-white/65">{companyInfo.emails.join(" | ")}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li><Link href="/programs">Programs</Link></li>
            <li><Link href="/crs-calculator">CRS Calculator</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="https://franco.app" target="_blank">Franco French Learning</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Locations</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            {locations.map((location) => (
              <li key={location.city}>{location.city}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Social</h3>
          <div className="mt-3 flex gap-3 text-white/80">
            <Link href={socialLinks.youtube} target="_blank"><Youtube size={18} /></Link>
            <Link href={socialLinks.instagram} target="_blank"><Instagram size={18} /></Link>
            <Link href={socialLinks.linkedin} target="_blank"><Linkedin size={18} /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
