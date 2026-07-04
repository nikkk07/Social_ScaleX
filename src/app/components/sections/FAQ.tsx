import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { Reveal } from "../effects/Reveal";

export const faqs = [
  {
    q: "What does Social ScaleX actually do for a brand?",
    a: "We run your social media end to end. That covers content strategy, shooting and editing Reels and Shorts, posting schedules, community management, paid campaigns on Meta and YouTube, and a monthly report built from your own account analytics — not vanity screenshots. You approve the direction; we handle the daily grind.",
  },
  {
    q: "Which platforms do you manage?",
    a: "Instagram, Facebook, and YouTube. We deliberately don't spread across ten platforms — these three are where our systems, our ad experience, and our results live. One managed Instagram account currently sits at 336K followers, and one managed YouTube channel at 96.6K subscribers.",
  },
  {
    q: "How long until we see real growth?",
    a: "Honest answer: the first 30 days are setup and testing — audit, content pillars, and finding what your audience responds to. Most accounts see measurable movement in reach and engagement by day 60, and compounding growth from day 90 onward. Anyone promising viral results in week one is guessing with your money.",
  },
  {
    q: "Do you work with small businesses or only creators?",
    a: "Both. Our portfolio includes travel creators, lifestyle vloggers, and e-commerce brands like an outdoor-gear store whose Instagram now drives direct product sales. If your customers are on Instagram, Facebook, or YouTube, the same growth systems apply.",
  },
  {
    q: "Who owns the accounts and the content?",
    a: "You do — always. Accounts stay in your name, passwords stay with you, and every Reel, post, and ad creative we produce belongs to your brand. If we ever part ways, everything stays with you, including the strategy documents.",
  },
  {
    q: "Where are you based, and do you work remotely?",
    a: "We're a social media marketing agency based in Delhi NCR, and most of our shoots happen across Delhi, Noida, and Gurugram. Management, ads, and reporting work happens remotely, so we take on brands from anywhere in India.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-24 md:py-32 relative border-t border-white/5 section-cv"
    >
      <div className="max-w-3xl mx-auto px-6">
        <Reveal className="text-center mb-14">
          <span className="text-[var(--color-cyan)] font-medium tracking-wider uppercase text-sm mb-4 block">
            Questions, answered
          </span>
          <h2 id="faq-heading" className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Before you book the call.
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            The things brands ask us most — answered straight, no sales script.
          </p>
        </Reveal>

        <div className="space-y-3">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 0.05}>
                <div className={`rounded-2xl transition-colors duration-300 ${isOpen ? "liquid-glass" : "liquid-glass-lite"}`}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    className="w-full flex items-center justify-between gap-4 text-left px-6 py-5"
                  >
                    <h3 className="text-base md:text-lg font-display font-semibold text-white">
                      {item.q}
                    </h3>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="shrink-0 text-white/60"
                    >
                      <Plus size={20} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-white/65 leading-relaxed text-sm md:text-base">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* FAQPage structured data — mirrors the visible Q&A exactly */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </section>
  );
}
