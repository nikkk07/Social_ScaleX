import React from "react";
import Link from "next/link";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import { WhatsappIcon } from "../icons/WhatsappIcon";
import { SERVICES } from "@/lib/content";
import { CONTACTS, SOCIAL_PROFILES, WHATSAPP_URL } from "@/lib/site";

/*
 * Profile URLs come from src/lib/site.ts, which also feeds the JSON-LD
 * `sameAs`. Filling one in there updates both — the footer icon appears and
 * the entity gains the profile at the same time, instead of drifting apart.
 * Empty entries are filtered out, so nothing ever links to "#".
 */
const SOCIAL_LINKS = [
  { name: "WhatsApp", url: WHATSAPP_URL, icon: WhatsappIcon },
  { name: "Instagram", url: SOCIAL_PROFILES.instagram, icon: Instagram },
  { name: "LinkedIn", url: SOCIAL_PROFILES.linkedin, icon: Linkedin },
  { name: "YouTube", url: SOCIAL_PROFILES.youtube, icon: Youtube },
];

export function Footer() {
  return (
    <footer className="relative z-10 pt-section pb-10 border-t border-stroke text-ink section-cv">
      <div className="max-w-wide mx-auto px-gutter">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">

          <div className="lg:col-span-2">
            <Link href="/" aria-label="Social ScaleX home" className="inline-block text-2xl font-bold font-display tracking-tight text-ink mb-4">
              Social <span className="text-growth">ScaleX</span>
            </Link>
            <p className="text-ink-muted font-medium mb-2">
              Social media marketing agency, Delhi NCR.
            </p>
            <p className="text-ink-subtle text-sm mb-6">
              Instagram, Facebook &amp; YouTube growth for brands and creators — real clients, verified results.
            </p>
            <div className="flex items-center space-x-4">
              {SOCIAL_LINKS.filter((s) => s.url).map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Social ScaleX on ${s.name}`}
                  className="liquid-glass-lite h-10 w-10 rounded-pill flex items-center justify-center transition-transform hover:scale-110 text-ink-muted hover:text-ink"
                >
                  <s.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Services">
            <h4 className="font-bold text-ink mb-6">Services</h4>
            <ul className="space-y-3 text-ink-muted text-sm">
              {SERVICES.slice(0, 5).map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services#${s.slug}`}
                    className="hover:text-cta transition-colors"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/services" className="hover:text-cta transition-colors">
                  All services
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <h4 className="font-bold text-ink mb-6">Company</h4>
            <ul className="space-y-3 text-ink-muted text-sm">
              <li><Link href="/about" className="hover:text-cta transition-colors">About Us</Link></li>
              <li><Link href="/case-studies" className="hover:text-cta transition-colors">Case Studies</Link></li>
              <li><Link href="/services" className="hover:text-cta transition-colors">Services</Link></li>
              <li><Link href="/#process" className="hover:text-cta transition-colors">Our Process</Link></li>
              <li><Link href="/#faq" className="hover:text-cta transition-colors">FAQ</Link></li>
              <li>
                <a
                  href="https://forms.gle/uDWsX4886U4jGukK8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cta transition-colors"
                >
                  Careers
                </a>
              </li>
            </ul>
          </nav>

          <address className="not-italic">
            <h4 className="font-bold text-ink mb-6">Talk to us</h4>
            <ul className="space-y-4 text-sm">
              {CONTACTS.map((c) => (
                <li key={c.phone}>
                  <div className="text-ink-subtle text-xs mb-1">{c.name}</div>
                  <a
                    href={`tel:${c.phone}`}
                    className="font-medium text-ink hover:text-cta transition-colors"
                  >
                    {c.display}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <Link href="/#contact" className="text-cta font-medium hover:underline">Send a query / request a callback</Link>
              </li>
            </ul>
          </address>

        </div>

        <div className="pt-8 border-t border-stroke flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-ink-subtle">
          <div>&copy; {new Date().getFullYear()} Social ScaleX. All rights reserved.</div>
          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
            {/* Internal team entry point — deliberately understated (A4). */}
            <Link href="/login" className="hover:text-ink transition-colors">Team Login</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
