'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

interface NavItem {
  name: string;
  href: string;
  /** Real routes get active marking; in-page anchors cannot. */
  route?: boolean;
}

const LINKS: NavItem[] = [
  { name: 'Services', href: '/services', route: true },
  { name: 'Case Studies', href: '/case-studies', route: true },
  { name: 'About', href: '/about', route: true },
  { name: 'Contact', href: '/#contact' },
];

/**
 * Floating glass nav + scroll progress.
 *
 * Motion budget: zero libraries. The capsule entrance is `.rise-in`, the
 * mobile menu stagger is CSS `transition-delay` off a `--i` index, and the
 * progress bar is a composited `scaleX`. GSAP stays reserved for split-text,
 * scrub and parallax, so nothing here waits on a chunk to become usable.
 *
 * One passive scroll listener drives both the capsule shrink and the progress
 * bar, writing to a CSS custom property rather than React state — a scroll
 * position in state would re-render the tree on every frame of every scroll.
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Tracks whether the hero's own CTA has left the screen. See the CTA
  // variant note below for why the nav needs to know.
  const [pastHero, setPastHero] = useState(false);
  const session = useSession();
  const pathname = usePathname();

  const progressRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // ── Scroll: capsule shrink + progress bar, one listener, rAF-coalesced ──
  useEffect(() => {
    let frame = 0;
    let queued = false;

    const measure = () => {
      queued = false;
      const y = window.scrollY;

      // Booleans only — these flip a couple of times per page, not every
      // frame, so they are cheap to hold in state.
      const isScrolled = y > 40;
      const isPastHero = y > window.innerHeight * 0.7;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
      setPastHero((prev) => (prev !== isPastHero ? isPastHero : prev));

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progressRef.current?.style.setProperty('--scroll-progress', String(ratio));
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  // Close on route change — otherwise the overlay survives a client-side
  // navigation and covers the page the visitor just asked for.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // ── Overlay: scroll lock, Escape, focus trap, focus restore ──
  useEffect(() => {
    if (!isOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;

      // Trap: a full-screen overlay that lets focus walk onto the page
      // behind it strands keyboard users on controls they cannot see.
      const focusables = overlayRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      // Send focus back to the control that opened the overlay.
      toggleRef.current?.focus();
    };
  }, [isOpen]);

  const isActive = (item: NavItem) => item.route === true && pathname === item.href;

  // Signed in -> CRM entry; signed out -> the marketing CTA. There is no
  // standalone "Login" link: the CRM is an internal tool, not a portal.
  const ctaHref = session ? '/crm' : '/#contact';
  const ctaLabel = session ? 'CRM' : 'Get a free call';

  /*
   * The nav CTA is ghost while the hero's own CTA is still on screen, and
   * becomes the cyan accent only once the hero has scrolled away.
   *
   * Two cyan pills visible at once is two primary actions, which is none —
   * the accent stops meaning "this is the thing to press" the moment it
   * appears twice. This keeps exactly one accented action on screen at any
   * scroll position, using state the scroll listener already tracks.
   */
  const ctaVariant = pastHero ? 'btn-cta' : 'btn-ghost';

  return (
    <>
      <div
        ref={progressRef}
        className="scroll-progress"
        role="presentation"
        aria-hidden
      />

      <nav
        aria-label="Main"
        className="rise-in fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
      >
        <div
          className={`liquid-glass-strong rounded-pill flex items-center justify-between pl-6 pr-2 transition-[height,box-shadow] duration-500 ease-out-quint ${
            scrolled ? 'h-14' : 'h-16'
          }`}
        >
          <Link
            href="/"
            aria-label="Social ScaleX home"
            className="flex-shrink-0 text-xl font-bold font-display tracking-tight text-ink z-50 relative"
          >
            Social <span className="text-growth">ScaleX</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="nav-link"
                aria-current={isActive(link) ? 'page' : undefined}
              >
                {link.name}
              </Link>
            ))}
            <Link href={ctaHref} className={`btn btn-sm ${ctaVariant} ml-2`}>
              {ctaLabel}
            </Link>
          </div>

          {/* 50px square — clears the 44px touch floor with the icon centred. */}
          <button
            ref={toggleRef}
            type="button"
            className="md:hidden p-3 text-ink z-50 relative"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen((v) => !v)}
          >
            {isOpen ? <X size={26} aria-hidden /> : <Menu size={26} aria-hidden />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        ref={overlayRef}
        data-open={isOpen}
        // .nav-overlay carries its own opaque ground — see theme.css for why it
        // must not reuse .liquid-glass-strong here.
        className="nav-overlay fixed inset-0 flex flex-col justify-center items-center px-gutter z-40 md:hidden"
      >
        <div className="flex flex-col gap-6 items-center w-full max-w-xs">
          {LINKS.map((link, i) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={close}
              aria-current={isActive(link) ? 'page' : undefined}
              // --i drives the CSS stagger; no JS timeline involved.
              style={{ '--i': i } as React.CSSProperties}
              className="nav-stagger text-3xl font-display font-bold text-ink aria-[current=page]:text-cta"
            >
              {link.name}
            </Link>
          ))}

          <Link
            href={ctaHref}
            onClick={close}
            style={{ '--i': LINKS.length } as React.CSSProperties}
            className="nav-stagger btn btn-cta w-full mt-2"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </>
  );
}
