import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { AUTOMATION_LINKS, GOAL_LINKS, SERVICE_LINKS } from './nav';
import { GUIDES } from '@/lib/guides';
import { AREAS_SERVED, CONTACTS, SITE_NAME, WHATSAPP_URL, SOCIAL_PROFILES } from '@/lib/site';

const COMPANY = [
  { href: '/about', label: 'About us' },
  { href: '/case-studies', label: 'Client results' },
  { href: '/services', label: 'All services' },
  { href: '/areas', label: 'Areas we serve' },
  { href: '/guides', label: 'Guides' },
  { href: '/contact', label: 'Contact' },
];

const SOCIAL_LABEL: Record<keyof typeof SOCIAL_PROFILES, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
};

export function Footer() {
  const socials = (Object.keys(SOCIAL_PROFILES) as (keyof typeof SOCIAL_PROFILES)[]).filter((k) => SOCIAL_PROFILES[k]);
  return (
    <footer className="border-t border-line bg-paper-2 pb-28 md:pb-0">
      <div className="wrap grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm text-ink-2">
            Social media marketing agency in Delhi NCR. We run Instagram, Facebook and YouTube for brands and creators, and report every number from your own dashboard.
          </p>
          <address className="mt-6 space-y-2 text-sm not-italic">
            {CONTACTS.map((c) => (
              <p key={c.phone}>
                <a href={`tel:${c.phone}`} className="font-semibold text-ink hover:text-coral-text">{c.display}</a>
                <span className="text-ink-3"> · {c.name}</span>
              </p>
            ))}
            <p>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:text-coral-text">WhatsApp us</a>
            </p>
            <p className="text-ink-3">Shoots across {AREAS_SERVED.join(', ')}. Remote work across India. <Link href="/areas" className="underline underline-offset-2 hover:text-ink">Check your area</Link></p>
          </address>
          {socials.length ? (
            <ul className="mt-5 flex gap-4 text-sm">
              {socials.map((k) => (
                <li key={k}><a href={SOCIAL_PROFILES[k]} rel="me noopener noreferrer" target="_blank" className="link">{SOCIAL_LABEL[k]}</a></li>
              ))}
            </ul>
          ) : null}
        </div>
        <FooterCol title="Services" links={[...SERVICE_LINKS.map((s) => ({ href: s.href, label: s.label })), ...GOAL_LINKS]} />
        <FooterCol title="Automation" links={AUTOMATION_LINKS.map((s) => ({ href: s.href, label: s.label }))} />
        <FooterCol title="Company" links={COMPANY} />
        <FooterCol title="Guides" links={GUIDES.map((g) => ({ href: `/guides/${g.slug}`, label: g.metaTitle }))} />
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-2 py-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE_NAME}. Delhi NCR, India.</p>
          <p className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}><Link href={l.href} className="text-ink-2 hover:text-ink">{l.label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
