import React from "react";
import { Sparkles } from "lucide-react";

export function MarqueeStrip() {
  const services = [
    "Instagram Growth",
    "Facebook Ads",
    "YouTube SEO",
    "Brand Strategy",
    "Content Production",
    "Community Building",
    "Viral Campaigns",
    "Analytics & Insights",
    "Influencer Marketing",
    "Reels Strategy",
  ];

  // Double array for seamless looping
  const items = [...services, ...services];

  return (
    <div className="relative py-2">
      <div className="bg-white/[0.05] border-y border-white/10 overflow-hidden py-4 marquee-mask">
        <div className="flex whitespace-nowrap animate-marquee w-max">
          {items.map((item, index) => (
            <div key={index} className="flex items-center space-x-6 px-6">
              <span className="text-base md:text-lg font-display font-semibold text-white/70 tracking-wide uppercase">
                {item}
              </span>
              <Sparkles size={15} className="text-[var(--color-violet-light)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
