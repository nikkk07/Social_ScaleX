import React from 'react';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Logo } from './Logo';
import { AUTOMATION_LINKS, GOAL_LINKS, SERVICE_LINKS } from './nav';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { InstagramIcon, LinkedinIcon, YoutubeIcon } from '@/components/icons/PlatformIcons';
import { GUIDES } from '@/lib/guides';
import { CITIES } from '@/lib/areas';
import { CONTACTS, SITE_NAME, SOCIAL_PROFILES, WHATSAPP_URL } from '@/lib/site';

type L = { href: string; label: string };

const COMPANY: L[] = [
  { href: '/about', label: 'About us' },
  { href: '/case-studies', label: 'Client results' },
  { href: '/services', label: 'All services' },
  { href: '/automation', label: 'All automation' },
  { href: '/contact', label: 'Contact' },
];

/** Brand glyph and colour for each profile, shown like the WhatsApp button. */
const SOCIAL: Record<keyof typeof SOCIAL_PROFILES, { label: string; icon: React.ReactNode }> = {
  instagram: { label: 'Instagram', icon: <InstagramIcon size={18} className="text-[#C13584]" /> },
  linkedin: { label: 'LinkedIn', icon: <LinkedinIcon size={17} className="text-[#0A66C2]" /> },
  youtube: { label: 'YouTube', icon: <YoutubeIcon size={19} className="text-[#E00000]" /> },
};

const PILL =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-ink';

/**
 * Every public page is one click from every other page through this footer,
 * so crawlers reach the whole site from any entry point.
 */
export function Footer() {
  const socials = (Object.keys(SOCIAL_PROFILES) as (keyof typeof SOCIAL_PROFILES)[]).filter((k) => SOCIAL_PROFILES[k]);
  return (
    <footer className="border-t border-line bg-paper-2 pb-28 md:pb-0">
      <div className="wrap grid grid-cols-1 gap-12 py-14 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-ink-2">
            Social media marketing agency in Delhi NCR for brands and creators on Instagram, Facebook and YouTube.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {CONTACTS.map((c) => (
              <li key={c.phone}>
                <a href={`tel:${c.phone}`} className="inline-flex items-center gap-2 text-ink hover:text-coral-text">
                  <Phone className="size-4 text-ink-3" aria-hidden="true" />
                  <span className="font-semibold tabular-nums">{c.display}</span>
                  <span className="text-ink-3">{c.name.split(' ')[0]}</span>
                </a>
              </li>
            ))}
          </ul>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            <li>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={PILL}>
                <WhatsappIcon size={18} className="text-[#128C7E]" /> WhatsApp us
              </a>
            </li>
            {socials.map((k) => (
              <li key={k}>
                <a href={SOCIAL_PROFILES[k]} target="_blank" rel="me noopener noreferrer" className={PILL}>
                  {SOCIAL[k].icon} {SOCIAL[k].label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          <FooterCol title="Services" links={SERVICE_LINKS.map((s) => ({ href: s.href, label: s.label }))} />
          <div className="space-y-10">
            <FooterCol title="Automation" links={AUTOMATION_LINKS.map((s) => ({ href: s.href, label: s.label }))} />
            <FooterCol title="By goal" links={GOAL_LINKS} />
          </div>
          <FooterCol
            title="Areas we serve"
            links={[...CITIES.map((c) => ({ href: `/areas/${c.slug}`, label: c.name })), { href: '/areas', label: 'Check your pin code' }]}
          />
          <div className="space-y-10">
            <FooterCol title="Company" links={COMPANY} />
            <FooterCol title="Free guides" links={[...GUIDES.map((g) => ({ href: `/guides/${g.slug}`, label: g.navTitle })), { href: '/guides', label: 'All guides' }]} />
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-2 py-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE_NAME} · Delhi NCR, India · Shoots across Delhi NCR, remote work across India</p>
          <p className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: L[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm leading-snug">
        {links.map((l) => (
          <li key={l.href}><Link href={l.href} className="text-ink-2 hover:text-ink">{l.label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
