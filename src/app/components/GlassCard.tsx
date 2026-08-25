import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** @deprecated retained for call-site compatibility during the redesign; ignored. */
  theme?: "light" | "dark";
  /** @deprecated cursor tilt removed in the minimal-glass redesign; ignored. */
  tiltMax?: number;
}

/**
 * Plain liquid-glass panel.
 *
 * The cursor-tracking 3D tilt and specular glare — the most "design demo"
 * element on the old site — were removed in the minimal-glass redesign.
 * They undermined the credibility the page is trying to build. Hover now
 * only lifts elevation and brightens the border slightly; nothing more.
 * No motion, no per-frame work, no React re-renders on mousemove.
 */
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden liquid-glass",
        "transition-[transform,border-color] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-white/20",
        className
      )}
    >
      {children}
    </div>
  );
}
