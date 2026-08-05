import React from "react";

export function Process() {
  const steps = [
    {
      num: "01",
      title: "Brand & Audience Audit",
      desc: "We dissect your current presence, map your audience, and reverse-engineer what's working in your category — before writing a single post.",
      tags: ["Competitor analysis", "Audience mapping", "Platform audit"],
    },
    {
      num: "02",
      title: "Strategy & Content Architecture",
      desc: "Custom 90-day roadmap: content pillars, posting cadence, visual system, and platform-specific playbooks — built around your business goals.",
      tags: ["Content pillars", "Visual identity", "90-day roadmap"],
    },
    {
      num: "03",
      title: "Launch & Amplify",
      desc: "Execution day one: content goes live, ad campaigns launch, and engagement loops activate. We build momentum fast, deliberately.",
      tags: ["Content execution", "Paid amplification", "Community activation"],
    },
    {
      num: "04",
      title: "Measure, Iterate & Scale",
      desc: "Weekly data reviews, monthly deep-dives, and constant refinement. What compounds gets doubled down on. What doesn't gets cut.",
      tags: ["Weekly reporting", "A/B optimization", "Scaling playbook"],
    },
  ];

  return (
    <section
      id="process"
      aria-label="How we work"
      className="py-24 md:py-32 relative border-t border-white/5 overflow-hidden section-cv"
    >
      <div className="max-w-4xl mx-auto px-6 relative">
        <div className="text-center mb-20">
          <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
            How we work
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
            Growth isn&apos;t luck. It&apos;s engineered.
          </h2>
        </div>

        <div className="relative">
          {/* Static timeline line — a fixed violet->emerald gradient. The old
              scroll-linked spring fill (and its retired cyan mid-stop) is gone. */}
          <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[var(--color-violet)] to-[var(--color-emerald)] md:-translate-x-1/2" />

          <div className="space-y-16 md:space-y-24 relative z-10">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={step.num}
                  className="flex flex-col md:flex-row items-start md:items-center relative"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[12px] md:left-1/2 w-8 h-8 rounded-full bg-[var(--color-void-black)] border-4 border-[var(--color-violet)] md:-translate-x-1/2 flex items-center justify-center z-20 top-0 md:top-auto">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>

                  {/* Content — alternates left/right on desktop */}
                  <div
                    className={`w-full md:w-1/2 pl-16 md:pl-0 pt-1 md:pt-0 ${
                      isEven ? "md:pr-16 md:text-right" : "md:ml-auto md:pl-16"
                    }`}
                  >
                    <span className="text-5xl font-display font-bold text-white/10 mb-4 block">
                      {step.num}
                    </span>
                    <h3 className="text-2xl font-display font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-white/70 leading-relaxed mb-6">{step.desc}</p>
                    <div
                      className={`flex flex-wrap gap-2 ${
                        isEven ? "md:justify-end" : "justify-start"
                      }`}
                    >
                      {step.tags.map((tag) => (
                        <span
                          key={tag}
                          className="liquid-glass-lite px-3 py-1 rounded-full text-xs text-white/80 whitespace-nowrap"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
