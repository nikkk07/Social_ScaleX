import React from 'react';
import { cn } from '@/lib/cn';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /**
   * @deprecated Retained for call-site compatibility. Scroll-driven CSS
   * timelines are positional, not time-based, so a delay has no meaning —
   * stagger comes from where an element sits in the scroll range instead.
   */
  delay?: number;
  /** @deprecated Always once; a CSS view() timeline has no replay concept. */
  once?: boolean;
}

/**
 * The single entrance animation for the marketing site: a quiet fade + short
 * rise as the element enters the viewport.
 *
 * This is a server component and ships no JavaScript. The animation lives
 * entirely in `.reveal` (src/styles/theme.css) on a scroll-driven timeline,
 * and degrades to plain visible content where those are unsupported.
 */
export function Reveal({ children, className }: RevealProps) {
  return <div className={cn('reveal', className)}>{children}</div>;
}
