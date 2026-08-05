import React from "react";
import { GlassCard } from "../GlassCard";
import { Reveal } from "../effects/Reveal";
import { ArrowRight, Instagram, Youtube } from "lucide-react";

export function Work() {
  const portfolio = [
    {
      id: "acdelhivlogs",
      category: "Travel & Lifestyle Vlogging",
      platform: "Instagram + YouTube",
      client: "acdelhivlogs",
      description: "Digital creator covering events, places, and travel & adventure across Delhi NCR — full Instagram + YouTube management.",
      metrics: [
        { value: "336K", label: "IG Followers" },
        { value: "4.2M", label: "Views/30 days" },
        { value: "96.6K", label: "YT Subscribers" }
      ],
      gradient: "from-purple-500/25 to-blue-500/25"
    },
    {
      id: "journey",
      category: "Travel Content",
      platform: "Instagram + YouTube",
      client: "Journey Without Visa",
      description: "Reel creator covering new places, events, travel, lifestyle, and food — grew from a standing start into a real audience.",
      metrics: [
        { value: "10.6K", label: "IG Followers" },
        { value: "22.1K", label: "YT Subscribers" },
        { value: "+514", label: "Subs/28 days" }
      ],
      gradient: "from-emerald-500/25 to-teal-500/25"
    },
    {
      id: "subh",
      category: "Travel & Stories",
      platform: "Instagram",
      client: "the_subh_journey",
      description: "A journey of a thousand miles begins with a single step — Reel creator across travel, stories, events, and Delhi NCR.",
      metrics: [
        { value: "15.9K", label: "IG Followers" },
        { value: "1.6M", label: "Views/30 days" },
        { value: "109.6K", label: "Interactions" }
      ],
      gradient: "from-amber-500/25 to-orange-500/25"
    },
    {
      id: "prago",
      category: "E-commerce, Outdoor Gear",
      platform: "Instagram",
      client: "prago.outdoors",
      description: "Camping, trekking, hiking & riding gear wholesale store — Instagram presence built to drive direct product sales.",
      metrics: [
        { value: "14K", label: "Followers" },
        { value: "3.1M", label: "Views/30 days" },
        { value: "Verified", label: "Business" }
      ],
      gradient: "from-rose-500/25 to-pink-500/25"
    }
  ];

  const getPlatformIcon = (platform: string) => {
    if (platform === "Instagram + YouTube") {
      return (
        <div className="flex -space-x-1">
          <Instagram size={14} className="text-white" />
          <Youtube size={14} className="text-white" />
        </div>
      );
    }
    if (platform === "Instagram") return <Instagram size={14} className="text-white" />;
    return <Youtube size={14} className="text-white" />;
  };

  return (
    <section id="work" aria-label="Client portfolio" className="py-24 md:py-32 relative section-cv">
      <div className="max-w-7xl mx-auto px-6">

        <Reveal className="max-w-3xl mb-16">
          <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">Client portfolio</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Real accounts. Real numbers.</h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Every metric below comes directly from the client's own Instagram or YouTube dashboard — no projections, no rounding up.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {portfolio.map((item, i) => (
            <Reveal key={item.id} delay={(i % 2) * 0.12}>
              <GlassCard className="p-1 h-full">
                <div className={`h-48 rounded-t-[22px] bg-gradient-to-br ${item.gradient} flex items-center justify-center relative overflow-hidden border-b border-white/10`}>
                  {/* Mock Phone Frame Area */}
                  <div className="absolute inset-x-8 -bottom-8 top-8 rounded-t-3xl bg-black/40 border border-white/10 shadow-2xl backdrop-blur-sm flex flex-col items-center pt-8 px-4">
                    <div className="w-16 h-1 rounded-full bg-white/20 mb-4" />
                    <div className="w-full space-y-3">
                      <div className="h-4 bg-white/10 rounded-md w-3/4" />
                      <div className="h-24 bg-white/5 rounded-lg w-full" />
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 liquid-glass-lite rounded-full px-3 py-1.5 flex items-center space-x-2">
                    {getPlatformIcon(item.platform)}
                    <span className="text-xs font-medium text-white">{item.platform}</span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="mb-6">
                    <span className="text-xs font-semibold text-[var(--color-emerald)] uppercase tracking-wider block mb-2">{item.category}</span>
                    <h3 className="text-2xl font-display font-bold text-white mb-3">{item.client}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                    {item.metrics.map((metric, mi) => (
                      <div key={mi}>
                        <div className="text-xl font-display font-bold text-white mb-1">{metric.value}</div>
                        <div className="text-[10px] uppercase tracking-wider text-white/50">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>

        <Reveal className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 border-t border-white/10 pt-8">
          <p className="text-sm text-white/40 max-w-lg">
            Client data shared with permission. Analytics shown for demonstration purposes only. And many more brands beyond those shown here.
          </p>
          <a href="#contact" className="liquid-glass shine-sweep inline-flex items-center space-x-2 px-8 py-4 rounded-full font-medium text-white transition-transform hover:scale-[1.03] active:scale-95">
            <span>Work with us</span>
            <ArrowRight size={18} />
          </a>
        </Reveal>

      </div>
    </section>
  );
}
