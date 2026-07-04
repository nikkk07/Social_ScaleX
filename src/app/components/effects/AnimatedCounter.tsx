import React, { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

interface AnimatedCounterProps {
  value: string;
  className?: string;
  duration?: number;
}

/**
 * Counts up to values like "9.3M+", "496K+", "4+", "14" when scrolled
 * into view. Non-numeric prefix/suffix are preserved.
 */
export function AnimatedCounter({
  value,
  className,
  duration = 1.8,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const match = value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr);
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;

    setDisplay(`${prefix}${(0).toFixed(decimals)}${suffix}`);
    if (!inView) return;

    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) =>
        setDisplay(`${prefix}${latest.toFixed(decimals)}${suffix}`),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {display}
    </span>
  );
}
