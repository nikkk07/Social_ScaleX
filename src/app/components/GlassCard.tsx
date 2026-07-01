import React, { useRef, useState } from "react";
import { motion } from "motion/react";
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

export function GlassCard({
  children,
  className,
  theme = "light",
  tiltMax = 7,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    setRotateX(-(yPct - 0.5) * 2 * tiltMax);
    setRotateY((xPct - 0.5) * 2 * tiltMax);
    setGlarePos({ x: xPct * 100, y: yPct * 100 });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
        scale: isHovered ? 1.015 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 28,
        mass: 0.8,
      }}
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative rounded-3xl overflow-hidden will-change-transform",
        theme === "light"
          ? "glass-panel-light border border-black/6"
          : "glass-panel-dark border border-white/10",
        className
      )}
    >
      {/* Moving glare highlight */}
      <div
        className="pointer-events-none absolute inset-0 z-50 rounded-3xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${
            theme === "light" ? "0.45" : "0.15"
          }) 0%, transparent 55%)`,
          opacity: isHovered ? 1 : 0,
          mixBlendMode: "overlay",
        }}
      />

      {/* Permanent specular top-edge line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px z-40 bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
}
