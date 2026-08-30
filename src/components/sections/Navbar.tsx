'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

const links = [
  { name: 'Services', href: '/services' },
  { name: 'Case Studies', href: '/case-studies' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/#contact' },
];

/**
 * Floating glass nav.
 *
 * The entrance and the mobile-menu fade were Framer Motion; they are CSS now
 * (`.rise-in`, and a transition on the overlay). Motion was the largest
 * dependency on every marketing page and this was the last thing on them
 * using it — removing it took roughly 56 kB of gzipped JavaScript off every
 * public route, for two animations CSS does natively.
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const session = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll behind the mobile overlay.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Escape closes the overlay — expected of anything modal.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Signed in -> CRM entry; signed out -> the marketing CTA. No standalone
  // "Login" link in the nav (internal tool, not a customer portal).
  const desktopCta = session ? (
    <Link
      href="/crm"
      className="ml-2 bg-[var(--color-violet-cta)] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-transform duration-200 hover:scale-[1.04] active:scale-95"
    >
      CRM
    </Link>
  ) : (
    <Link
      href="/#contact"
      className="ml-2 bg-white text-[#0B0A10] px-5 py-2.5 rounded-full text-sm font-semibold transition-transform duration-200 hover:scale-[1.04] active:scale-95"
    >
      Start growing
    </Link>
  );

  return (
    <>
      <nav
        aria-label="Main"
        className="rise-in fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
      >
        <div
          className={`liquid-glass-strong rounded-full flex items-center justify-between pl-6 pr-2 transition-[height,box-shadow] duration-500 ${
            scrolled ? 'h-14 shadow-2xl shadow-black/40' : 'h-16'
          }`}
        >
          <Link
            href="/"
            aria-label="Social ScaleX home"
            className="flex-shrink-0 text-xl font-bold font-display tracking-tight text-white z-50 relative"
          >
            Social <span className="text-gradient">ScaleX</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
            {desktopCta}
          </div>

          <button
            type="button"
            className="md:hidden p-3 text-white z-50 relative"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={26} aria-hidden /> : <Menu size={26} aria-hidden />}
          </button>
        </div>
      </nav>

      {/*
        Kept mounted and toggled with opacity/visibility rather than unmounted,
        so the fade in AND out are plain CSS transitions — the exit animation
        was the only reason this needed AnimatePresence.
      */}
      <div
        id="mobile-menu"
        hidden={!isOpen}
        className={`fixed inset-0 liquid-glass-strong flex flex-col justify-center items-center px-6 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col space-y-6 items-center w-full">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-3xl font-display font-bold text-white"
            >
              {link.name}
            </Link>
          ))}

          <Link
            href={session ? '/crm' : '/#contact'}
            onClick={() => setIsOpen(false)}
            className={`w-full max-w-xs text-center px-8 py-4 rounded-full font-semibold text-lg mt-6 ${
              session
                ? 'bg-[var(--color-violet-cta)] text-white'
                : 'bg-white text-[#0B0A10]'
            }`}
          >
            {session ? 'CRM' : 'Start growing'}
          </Link>
        </div>
      </div>
    </>
  );
}
