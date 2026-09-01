import React from 'react';
import { cn } from '@/lib/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Plain liquid-glass panel. Hover lifts elevation and brightens the border;
 * nothing more. No motion library, no per-frame work, no re-render on
 * mousemove — and therefore no JavaScript at all.
 */
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-3xl overflow-hidden liquid-glass glass-hover',
        'transition-[transform,border-color] duration-300 ease-out',
        'hover:-translate-y-0.5',
        className,
      )}
    >
      {children}
    </div>
  );
}
