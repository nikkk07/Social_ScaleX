import React from "react";
import { GlassCard } from "../GlassCard";
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
    <section id="results" className="py-24 md:py-32 light-section relative border-t border-ink/5">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="max-w-3xl mb-16">
          <span className="text-[var(--color-violet)] font-medium tracking-wider uppercase text-sm mb-4 block">Verified results</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-ink mb-6">Numbers pulled straight from the dashboard.</h2>
          <p className="text-ink/60 text-lg leading-relaxed">
            No rounding up, no projections — every figure here is from the client's own Instagram or YouTube analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {results.map((result, i) => (
            <GlassCard 
              key={result.id} 
              theme="light" 
              className={`p-8 ${result.featured ? "md:col-span-2 lg:col-span-2" : ""}`}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full ${result.color} text-white flex items-center justify-center font-display font-bold text-xl shadow-inner`}>
                    {result.initial}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink">{result.handle}</h3>
                    <div className="flex items-center space-x-1.5 mt-1">
                      {result.platform.includes("Instagram") && <Instagram size={14} className="text-ink/50" />}
                      {result.platform.includes("YouTube") && <Youtube size={14} className="text-ink/50" />}
                      <span className="text-xs text-ink/50">{result.platform}</span>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
                  Verified
                </div>
              </div>

              <div className="mb-6">
                <div className="text-5xl md:text-6xl font-display font-bold text-gradient mb-2">{result.metric}</div>
                <div className="text-lg font-medium text-ink/70">{result.label}</div>
              </div>

              <div className="pt-6 border-t border-ink/10">
                <p className="text-sm text-ink/60 leading-relaxed">{result.detail}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        <p className="text-sm text-ink/40 text-center">
          Client data shared with permission. Analytics shown for demonstration purposes only.
        </p>

      </div>
    </section>
  );
}
