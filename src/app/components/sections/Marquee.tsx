import React from "react";
import { Star } from "lucide-react";

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
    <div className="bg-[var(--color-violet-light)]/10 border-y border-[var(--color-violet-light)]/20 overflow-hidden py-4 light-section">
      <div className="flex whitespace-nowrap animate-marquee w-[200%]">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-6 px-6">
            <span className="text-lg font-display font-bold text-ink/80 tracking-wide uppercase">
              {item}
            </span>
            <Star size={16} className="text-[var(--color-violet)] fill-current" />
          </div>
        ))}
      </div>
    </div>
  );
}
