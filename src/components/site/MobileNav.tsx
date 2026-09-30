'use client';
import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

type L = { href: string; label: string };

export function MobileNav({ services, nav, phone, phoneLabel, whatsapp }: { services: L[]; nav: L[]; phone: string; phoneLabel: string; whatsapp: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="grid size-11 place-items-center rounded-full border border-line-strong bg-surface text-ink"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
      </button>
      <div
        id={id}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[4.25rem] z-50 overflow-y-auto border-t border-line bg-paper"
      >
        <nav aria-label="Mobile" className="wrap py-6">
          <p className="eyebrow">Services</p>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="block rounded-xl px-3 py-3 text-base font-medium text-ink hover:bg-paper-2">{s.label}</Link>
              </li>
            ))}
          </ul>
          <ul className="mt-6 grid gap-1 border-t border-line pt-6">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block rounded-xl px-3 py-3 font-display text-2xl text-ink hover:bg-paper-2">{n.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3 pb-24">
            <Link href="/contact" className="btn btn-primary btn-lg">Book a free strategy call</Link>
            <a href={`tel:${phone}`} className="btn btn-secondary btn-lg">Call {phoneLabel}</a>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">WhatsApp us</a>
          </div>
        </nav>
      </div>
    </div>
  );
}
