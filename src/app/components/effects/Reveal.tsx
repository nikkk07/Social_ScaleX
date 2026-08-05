import React from "react";
import { motion } from "motion/react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

/**
 * The single entrance animation for the whole marketing site: a quiet
 * fade + short rise when an element scrolls into view. One variant, ~16px
 * travel, ~400ms, ease-out. Everything that enters uses this and nothing
 * else — the motion budget is one animation type per section. Transform +
 * opacity only (compositor-friendly). Disabled under reduced-motion via
 * the global media query in theme.css.
 */
export function Reveal({ children, className, delay = 0, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
