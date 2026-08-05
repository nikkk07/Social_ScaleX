import React from "react";
import { GlassCard } from "../GlassCard";
import { Reveal } from "../effects/Reveal";
import { ArrowRight, Instagram, Youtube, BadgeCheck } from "lucide-react";

export function Work() {
  const portfolio = [
    {
      id: "acdelhivlogs",
      category: "Travel & Lifestyle Vlogging",
      platform: "Instagram + YouTube",
      client: "acdelhivlogs",
      description:
        "Digital creator covering events, places, and travel & adventure across Delhi NCR — full Instagram + YouTube management.",
      metrics: [
        { value: "336K", label: "IG Followers" },
        { value: "4.2M", label: "Views/30 days" },
        { value: "96.6K", label: "YT Subscribers" },
      ],
      gradient: "from-purple-500/25 to-blue-500/25",
    },
    {
      id: "journey",
      category: "Travel Content",
      platform: "Instagram + YouTube",
      client: "Journey Without Visa",
      description:
        "Reel creator covering new places, events, travel, lifestyle, and food — grew from a standing start into a real audience.",
      metrics: [
        { value: "10.6K", label: "IG Followers" },
        { value: "22.1K", label: "YT Subscribers" },
        { value: "+514", label: "Subs/28 days" },
      ],
      gradient: "from-emerald-500/25 to-teal-500/25",
    },
    {
      id: "subh",
      category: "Travel & Stories",
      platform: "Instagram",
      client: "the_subh_journey",
      description:
        "A journey of a thousand miles begins with a single step — Reel creator across travel, stories, events, and Delhi NCR.",
      metrics: [
        { value: "15.9K", label: "IG Followers" },
        { value: "1.6M", label: "Views/30 days" },
        { value: "109.6K", label: "Interactions" },
      ],
      gradient: "from-amber-500/25 to-orange-500/25",
    },
    {
      id: "prago",
      category: "E-commerce, Outdoor Gear",
      platform: "Instagram",
      client: "prago.outdoors",
      description:
        "Camping, trekking, hiking & riding gear wholesale store — Instagram presence built to drive direct product sales.",
      metrics: [
        { value: "14K", label: "Followers" },
        { value: "3.1M", label: "Views/30 days" },
        { value: "Verified", label: "Business" },
      ],
      gradient: "from-rose-500/25 to-pink-500/25",
    },
  ];

  const getPlatformIcon = (platform: string) => {
    if (platform === "Instagram + YouTube") {
      return (
        <div className="flex -space-x-1">
          <Instagram size={13} className="text-white" />
          <Youtube size={13} className="text-white" />
        </div>
      );
    }
    if (platform === "Instagram") return <Instagram size={13} className="text-white" />;
    return <Youtube size={13} className="text-white" />;
  };

  return (
    <section
      id="work"
      aria-label="Client portfolio and verified results"
      className="py-24 md:py-32 relative section-cv"
    >
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="max-w-3xl mb-14">
          <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
            Client portfolio
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-5">
            Real accounts. Real numbers.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Every figure below is pulled straight from the client&apos;s own Instagram or
            YouTube dashboard — no projections, no rounding up.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
          {portfolio.map((item, i) => (
            <Reveal key={item.id} delay={(i % 2) * 0.1}>
              <GlassCard className="h-full">
                {/* Screenshot mock */}
                <div
                  className={`h-44 bg-gradient-to-br ${item.gradient} relative overflow-hidden border-b border-white/10`}
                >
                  <div className="absolute inset-x-10 top-9 bottom-0 rounded-t-2xl bg-black/30 border border-white/10 p-5">
                    <div className="w-12 h-1 rounded-full bg-white/20 mb-4" />
                    <div className="space-y-3">
                      <div className="h-3.5 bg-white/[0.12] rounded w-3/4" />
                      <div className="h-20 bg-white/[0.06] rounded-lg" />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 liquid-glass-lite rounded-full px-3 py-1.5 flex items-center gap-2">
                    {getPlatformIcon(item.platform)}
                    <span className="text-xs font-medium text-white">{item.platform}</span>
                  </div>
                  <div className="absolute top-4 right-4 liquid-glass-lite rounded-full px-2.5 py-1 flex items-center gap-1.5 text-[var(--color-emerald)]">
                    <BadgeCheck size={13} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Verified</span>
                  </div>
                </div>

                <div className="p-6 md:p-7">
                  <span className="text-xs font-semibold text-[var(--color-emerald)] uppercase tracking-wider block mb-2">
                    {item.category}
                  </span>
                  <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-2.5">
                    {item.client}
                  </h3>
                  <p className="text-white/65 text-sm leading-relaxed mb-6">{item.description}</p>

                  <div className="grid grid-cols-3 gap-3 pt-5 border-t border-white/10">
                    {item.metrics.map((metric, mi) => (
                      <div key={mi}>
                        <div className="text-lg md:text-xl font-display font-bold text-white mb-1">
                          {metric.value}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-white/55 leading-tight">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>

        <Reveal className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10 pt-8">
          <p className="text-sm text-white/55 max-w-lg">
            Client data shared with permission — and many more brands beyond those shown here.
          </p>
          <a
            href="#contact"
            className="liquid-glass inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-white transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          >
            <span>Work with us</span>
            <ArrowRight size={18} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
