import React from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';
import { NAV, SERVICE_LINKS } from './nav';
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
                  <Link href="/services" className="col-span-2 mt-1 inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-coral-text hover:bg-paper">
                    All services <ArrowRight className="size-4" aria-hidden="true" />
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
