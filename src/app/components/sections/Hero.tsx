import React from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { WordReveal } from "../effects/WordReveal";
import { MagneticButton } from "../effects/MagneticButton";

export function Hero() {
  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center pt-32 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center w-full">
        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6 }}
          className="liquid-glass inline-flex items-center space-x-2 px-5 py-2.5 rounded-full mb-10"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--color-emerald)] animate-pulse shrink-0" />
          <span className="text-sm font-medium text-white/80">
            Real clients. Real growth. Verified results.
          </span>
        </motion.div>

        {/* Headline — keynote-style word reveal */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-white mb-6 leading-[1.04]">
          <WordReveal
            text="We Grow Brands."
            delay={0.15}
            wordClassNames={{ 2: "text-gradient-animated" }}
          />
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed"
        >
          Social ScaleX is a social media marketing agency in Delhi NCR. We manage,
          create for, and scale brands across Instagram, Facebook, and YouTube —
          from Reels production to paid ads to the analytics that prove it&apos;s working.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-10"
        >
          <MagneticButton
            href="#contact"
            className="shine-sweep w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-[var(--color-violet)] to-[#6D28D9] text-white px-9 py-4 rounded-full font-semibold text-base shadow-[0_8px_32px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] border border-white/20"
          >
            Get a free strategy call
          </MagneticButton>
          <MagneticButton
            href="#results"
            className="liquid-glass w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-9 py-4 rounded-full font-semibold text-white/90 hover:text-white text-base transition-colors"
          >
            <span>See real client results</span>
            <ArrowRight size={18} />
          </MagneticButton>
        </motion.div>

        {/* Proof line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.95 }}
          className="text-sm text-white/40 font-medium tracking-wide"
        >
          Managing channels with 350K+ combined followers across Instagram &amp; YouTube.
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="liquid-glass-lite rounded-full p-2.5"
        >
          <ChevronDown size={18} className="text-white/70" />
        </motion.div>
      </motion.div>
    </section>
  );
}
