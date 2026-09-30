import React from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';
import { AUTOMATION_LINKS, GOAL_LINKS, NAV, SERVICE_LINKS } from './nav';
import { PRIMARY_PHONE, WHATSAPP_URL } from '@/lib/site';

export function Header() {
  return (
    <header className="site-header">
      <div className="wrap flex h-[4.25rem] items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 text-sm font-medium text-ink-2">
            <li className="menu">
              <Link href="/services" className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 hover:text-ink">
                Services <ChevronDown className="size-3.5" aria-hidden="true" />
              </Link>
              <div className="menu-panel">
                <div className="card grid grid-cols-2 gap-1 p-3 shadow-lift">
                  {SERVICE_LINKS.map((s) => (
                    <Link key={s.href} href={s.href} className="rounded-xl p-3 hover:bg-paper">
                      <span className="block font-semibold text-ink">{s.label}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs font-normal text-ink-3">{s.outcome}</span>
                    </Link>
                  ))}
                  <div className="col-span-2 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-3 pt-3 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">By goal</span>
                    {GOAL_LINKS.map((g) => (
                      <Link key={g.href} href={g.href} className="font-medium text-ink hover:text-coral-text">{g.label}</Link>
                    ))}
                  </div>
                  <Link href="/services" className="col-span-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-coral-text hover:bg-paper">
                    All services <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </li>
            <li className="menu">
              <Link href="/automation" className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 hover:text-ink">
                Automation <span className="rounded-full bg-coral-tint px-1.5 py-0.5 text-[0.6875rem] font-semibold text-coral-text">₹99</span> <ChevronDown className="size-3.5" aria-hidden="true" />
              </Link>
              <div className="menu-panel">
                <div className="card grid grid-cols-2 gap-1 p-3 shadow-lift">
                  {AUTOMATION_LINKS.map((s) => (
                    <Link key={s.href} href={s.href} className="rounded-xl p-3 hover:bg-paper">
                      <span className="block font-semibold text-ink">{s.label}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs font-normal text-ink-3">{s.outcome}</span>
                    </Link>
                  ))}
                  <Link href="/guides/free-instagram-comment-to-dm-automation" className="rounded-xl bg-paper-2 p-3 hover:bg-paper">
                    <span className="block font-semibold text-ink">Free comment-to-DM guide</span>
                    <span className="mt-0.5 block text-xs font-normal text-ink-3">Set it up yourself, step by step.</span>
                  </Link>
                  <Link href="/automation" className="col-span-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-coral-text hover:bg-paper">
                    All automation <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </li>
            {NAV.slice(0, 3).map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="rounded-full px-3.5 py-2 hover:text-ink">{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/contact" className="btn btn-primary hidden sm:inline-flex">Free strategy call</Link>
          <MobileNav
            services={SERVICE_LINKS.map(({ href, label }) => ({ href, label }))}
            automations={[{ href: '/automation', label: 'All automation' }, ...AUTOMATION_LINKS.map(({ href, label }) => ({ href, label }))]}
            nav={[...NAV]}
            phone={PRIMARY_PHONE.phone}
            phoneLabel={PRIMARY_PHONE.display}
            whatsapp={WHATSAPP_URL}
          />
        </div>
      </div>
    </header>
  );
}
