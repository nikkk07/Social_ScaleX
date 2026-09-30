import React from 'react';
import Link from 'next/link';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" aria-label="Social ScaleX, home" className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="9" fill="#16140F" />
        <path d="M10 22 22 10M12.5 10H22v9.5" fill="none" stroke="#F07A5E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-[1.3rem] font-semibold tracking-[-0.02em] text-ink">
        Social Scale<span className="text-coral-text">X</span>
      </span>
    </Link>
  );
}
