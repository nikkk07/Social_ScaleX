import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  theme?: "light" | "dark";
  tiltMax?: number;
}

/**
 * Liquid glass card: 3D cursor tilt + a specular glow that tracks the
 * cursor. Everything runs on motion values and compositor-only
 * properties (transform/opacity) — mousemove triggers no React
 * re-renders and no repaints, so it stays smooth on 120Hz displays.
 */
export function GlassCard({
  children,
  className,
  theme = "dark",
  tiltMax = 6,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Pointer position as 0..1 percentages of the card
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const spring = { stiffness: 280, damping: 28, mass: 0.8 };
  const rotateX = useSpring(useTransform(py, [0, 1], [tiltMax, -tiltMax]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-tiltMax, tiltMax]), spring);
  const scale = useSpring(1, spring);

  // Glow is a fixed pre-painted radial layer moved with transforms only
  const glowX = useTransform(px, (v) => `${v * 100 - 50}%`);
  const glowY = useTransform(py, (v) => `${v * 100 - 50}%`);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    scale.set(1.015);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    scale.set(1);
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        scale,
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative rounded-3xl overflow-hidden will-change-transform liquid-glass",
        className
      )}
    >
      {/* Cursor-tracking specular glow — painted once, moved via transform */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 transition-opacity duration-300"
        style={{
          x: glowX,
          y: glowY,
          opacity: isHovered ? 1 : 0,
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.10) 0%, rgba(167,139,250,0.07) 30%, transparent 60%)",
        }}
      />

      {/* Permanent specular top-edge line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px z-40 bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
}
