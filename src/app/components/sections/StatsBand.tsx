import React from "react";
import { GlassCard } from "../GlassCard";
import { Reveal } from "../effects/Reveal";
import { AnimatedCounter } from "../effects/AnimatedCounter";

export function StatsBand() {
  const stats = [
    { value: "4+", label: "Brands actively managed" },
    { value: "9.3M+", label: "Combined monthly views" },
    { value: "496K+", label: "Combined followers & subscribers" },
    { value: "14", label: "Services offered, end to end" },
  ];

  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <GlassCard className="p-8 md:p-12" tiltMax={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center pt-8 md:pt-0 px-4 first:pt-0"
                >
                  <AnimatedCounter
                    value={stat.value}
                    className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gradient mb-3"
                  />
                  <span className="text-sm md:text-base font-medium text-white/60 max-w-[200px]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
