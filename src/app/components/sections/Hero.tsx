import React from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-40 md:pt-52 md:pb-52 overflow-hidden light-section">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-[15%] w-[560px] h-[560px] bg-[var(--color-violet-light)] rounded-full mix-blend-multiply filter blur-[130px] opacity-35 animate-pulse pointer-events-none" />
      <div className="absolute top-1/3 right-[15%] w-[420px] h-[420px] bg-[var(--color-emerald)] rounded-full mix-blend-multiply filter blur-[130px] opacity-25 pointer-events-none" />
      <div className="absolute bottom-1/4 left-[30%] w-[500px] h-[500px] bg-[var(--color-amber)] rounded-full mix-blend-multiply filter blur-[130px] opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">

        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-lg border border-black/8 px-5 py-2.5 rounded-full mb-10 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--color-emerald)] animate-pulse shrink-0" />
          <span className="text-sm font-semibold text-ink/80">
            Real clients. Real growth. Verified results.
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-ink mb-6 leading-[1.05]"
        >
          We Grow <span className="text-gradient">Brands.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="text-lg md:text-xl text-ink/65 max-w-2xl mb-10 leading-relaxed"
        >
          Social ScaleX manages, creates for, and scales brands across Instagram,
          Facebook, and YouTube — from content production to paid ads to the
          analytics that prove it&apos;s working.
        </motion.p>

        {/* CTAs — no duplicate Scroll text between them */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-10"
        >
          <a
            href="#contact"
            className="w-full sm:w-auto bg-[var(--color-violet)] hover:bg-[var(--color-violet)]/90 text-white px-9 py-4 rounded-full font-semibold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/30 text-base"
          >
            Get a free strategy call
          </a>
          <a
            href="#results"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-9 py-4 rounded-full font-semibold text-ink border-2 border-ink/10 hover:border-ink/20 hover:bg-ink/5 transition-all text-base"
          >
            <span>See real client results</span>
            <ArrowRight size={18} />
          </a>
        </motion.div>

        {/* Proof line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.36 }}
          className="text-sm text-ink/50 font-medium tracking-wide"
        >
          Managing channels with 350K+ combined followers across Instagram &amp; YouTube.
        </motion.p>
      </div>

      {/* Scroll indicator — single, clean, at bottom */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 pointer-events-none">
       
      </div>
    </section>
  );
}
