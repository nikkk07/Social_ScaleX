import React from "react";
import { GlassCard } from "../GlassCard";
import { Reveal } from "../effects/Reveal";
import { AnimatedCounter } from "../effects/AnimatedCounter";
import { Instagram, Youtube } from "lucide-react";

export function Results() {
  const results = [
    {
      id: "acdelhivlogs",
      initial: "A",
      color: "bg-blue-500",
      handle: "acdelhivlogs",
      platform: "Instagram + YouTube",
      metric: "4.2M",
      label: "views in 30 days",
      detail: "336K Instagram followers, 96.6K YouTube subscribers, managed end to end.",
      featured: true,
    },
    {
      id: "journey",
      initial: "J",
      color: "bg-emerald-500",
      handle: "Journey Without Visa",
      platform: "YouTube",
      metric: "+514",
      label: "subscribers in 28 days",
      detail: "22.1K YouTube subscribers and 401.6K Instagram views in the last 30 days.",
      featured: false,
    },
    {
      id: "subh",
      initial: "S",
      color: "bg-amber-500",
      handle: "the_subh_journey",
      platform: "Instagram",
      metric: "1.6M",
      label: "views in 30 days",
      detail: "109.6K interactions and 1K new followers tracked in a single insights window.",
      featured: false,
    },
    {
      id: "prago",
      initial: "P",
      color: "bg-rose-500",
      handle: "prago.outdoors",
      platform: "Instagram",
      metric: "3.1M",
      label: "views in 30 days",
      detail: "14K followers on a verified business account selling outdoor gear direct to consumer.",
      featured: false,
    }
  ];

  return (
    <section id="results" aria-label="Verified client results" className="py-24 md:py-32 relative border-t border-white/5 section-cv">
      <div className="max-w-7xl mx-auto px-6">

        <Reveal className="max-w-3xl mb-16">
          <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">Verified results</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Numbers pulled straight from the dashboard.</h2>
          <p className="text-white/60 text-lg leading-relaxed">
            No rounding up, no projections — every figure here is from the client's own Instagram or YouTube analytics.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {results.map((result, i) => (
            <Reveal
              key={result.id}
              delay={i * 0.1}
              className={result.featured ? "md:col-span-2 lg:col-span-2" : ""}
            >
              <GlassCard className="p-8 h-full">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full ${result.color} text-white flex items-center justify-center font-display font-bold text-xl border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]`}>
                      {result.initial}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{result.handle}</h3>
                      <div className="flex items-center space-x-1.5 mt-1">
                        {result.platform.includes("Instagram") && <Instagram size={14} className="text-white/50" />}
                        {result.platform.includes("YouTube") && <Youtube size={14} className="text-white/50" />}
                        <span className="text-xs text-white/50">{result.platform}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full liquid-glass-lite text-[var(--color-emerald)] text-xs font-bold uppercase tracking-wider">
                    Verified
                  </div>
                </div>

                <div className="mb-6">
                  <AnimatedCounter
                    value={result.metric}
                    className="text-5xl md:text-6xl font-display font-bold text-gradient mb-2 block"
                  />
                  <div className="text-lg font-medium text-white/70">{result.label}</div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-sm text-white/60 leading-relaxed">{result.detail}</p>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>

        <p className="text-sm text-white/40 text-center">
          Client data shared with permission. Analytics shown for demonstration purposes only.
        </p>

      </div>
    </section>
  );
}
