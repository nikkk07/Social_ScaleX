import React from "react";
import { Reveal } from "../effects/Reveal";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";

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
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-24 md:py-32 relative border-t border-white/5 section-cv"
    >
      <div className="max-w-3xl mx-auto px-6">
        <Reveal className="text-center mb-14">
          <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
            Questions, answered
          </span>
          <h2
            id="faq-heading"
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4"
          >
            Before you book the call.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            The things brands ask us most — answered straight, no sales script.
          </p>
        </Reveal>

        <Reveal>
          <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
            {faqs.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`item-${i}`}
                className="liquid-glass rounded-2xl border-b-0 px-6"
              >
                <AccordionTrigger className="text-base md:text-lg font-display font-semibold text-white hover:no-underline py-5">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/70 leading-relaxed text-sm md:text-base pb-6">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
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
