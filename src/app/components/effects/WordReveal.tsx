import React from "react";
import { motion } from "motion/react";

interface WordRevealProps {
  text: string;
  className?: string;
  /** className applied to specific words, keyed by word index */
  wordClassNames?: Record<number, string>;
  delay?: number;
  as?: "h1" | "h2" | "p" | "span";
}

/**
 * Keynote-style headline reveal: each word blurs and floats into place
 * with a soft stagger. Words are inline-block, so spacing uses
 * inside each span (regular trailing spaces would collapse).
 */
export function WordReveal({
  text,
  className,
  wordClassNames = {},
  delay = 0,
  as = "span",
}: WordRevealProps) {
  const words = text.split(" ");
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.09, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden
          className={`inline-block will-change-transform ${wordClassNames[i] ?? ""}`}
          variants={{
            hidden: { opacity: 0, y: "0.45em", filter: "blur(14px)" },
            visible: { opacity: 1, y: "0em", filter: "blur(0px)" },
          }}
          transition={{ duration: 0.75, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Tag>
  );
}
