import React from "react";
import { motion } from "motion/react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

/**
 * Apple-style scroll reveal: fade + rise + blur-in when entering the viewport.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 32,
  once = true,
}: RevealProps) {
  // Opacity + transform only — animating CSS blur() during scroll forces
  // costly re-rasterization and is the main source of scroll jank.
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
