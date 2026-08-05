import React from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

/** One entrance animation for the section: a quiet staggered fade-up.
 *  Transform + opacity only; no blur, no loops, no cursor tricks. */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center pt-32 pb-24">
      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
        className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center text-center w-full"
      >
        {/* Eyebrow */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.4, ease }}
          className="liquid-glass inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-emerald)] shrink-0" />
          <span className="text-sm font-medium text-white/75">
            Real clients. Real growth. Verified results.
          </span>
        </motion.div>

        {/* Headline — appears as a whole unit */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.4, ease }}
          className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-6 leading-[1.05]"
        >
          We Grow <span className="text-gradient">Brands.</span>
        </motion.h1>

        {/* One-line subhead — keeps the primary SEO phrase */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.4, ease }}
          className="text-lg md:text-xl text-white/70 max-w-2xl mb-10 leading-relaxed"
        >
          A social media marketing agency in Delhi NCR — Instagram, Facebook and
          YouTube growth for brands and creators.
        </motion.p>

        {/* One primary CTA + one text link */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.4, ease }}
          className="flex flex-col sm:flex-row items-center gap-5"
        >
          <a
            href="#contact"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[var(--color-violet-cta)] text-white px-8 py-4 rounded-full font-semibold text-base border border-white/15 shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-[transform,background-color] duration-200 hover:bg-[var(--color-violet)] hover:scale-[1.02] active:scale-[0.99]"
          >
            Get a free strategy call
          </a>
          <a
            href="#work"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white font-medium transition-colors"
          >
            See real client results
            <ArrowRight size={17} />
          </a>
        </motion.div>

        {/* Quiet proof line */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.4, ease }}
          className="text-sm text-white/60 font-medium tracking-wide mt-10"
        >
          376K+ combined Instagram followers across the brands we manage.
        </motion.p>
      </motion.div>
    </section>
  );
}
