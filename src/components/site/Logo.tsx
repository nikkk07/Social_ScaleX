import React from 'react';
import Link from 'next/link';

/**
 * The X of ScaleX: a heavy ink stroke (the brand) crossed by a thin coral
 * stroke that rises past the cap height (the growth). Sized in em, so it
 * scales with the wordmark's font size.
 */
export function XMark({ className = '', accent = 'var(--color-cta)' }: { className?: string; accent?: string }) {
  return (
    <svg viewBox="0 0 26 30" className={className} aria-hidden="true" focusable="false" overflow="visible">
      <path d="M4.2 5.5 17.8 25.5" stroke="currentColor" strokeWidth="4.4" strokeLinecap="square" fill="none" />
      <path d="M5 25.5 23.5 1.5" stroke={accent} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Social ScaleX, home"
      className={`inline-flex items-baseline whitespace-nowrap font-display text-[1.45rem] font-semibold leading-none tracking-[-0.02em] text-ink ${className}`}
    >
      Social Scale
      <XMark className="ml-[0.01em] h-[0.95em] w-auto translate-y-[0.16em]" />
      <span className="sr-only">X</span>
    </Link>
  );
}
