import React from "react";
import { Reveal } from "../effects/Reveal";
import { Instagram, Facebook, Youtube } from "lucide-react";

const services = [
  {
    id: "01",
    title: "Instagram Page Management",
    desc: "Feed, Reels, Stories and Collabs — a full-stack presence engineered for the Explore algorithm.",
  },
  {
    id: "02",
    title: "Content Creation",
    desc: "Reels, posts, explainer videos and Shorts — scroll-stopping creative produced and edited in-house.",
  },
  {
    id: "03",
    title: "Paid Ads Management",
    desc: "Campaign architecture, targeting and creative testing across Meta and YouTube — built to convert.",
  },
  {
    id: "04",
    title: "Profile Optimization",
    desc: "Bio, link-in-bio, highlights and channel layout tuned so visitors convert into followers.",
  },
  {
    id: "05",
    title: "Analytics & Reporting",
    desc: "Real dashboards from real accounts — views, watch time and subscriber velocity, reviewed weekly.",
  },
  {
    id: "06",
    title: "Product & Event Shoots",
    desc: "Product photoshoots, event coverage, teasers and on-location shoots — content captured, not stocked.",
  },
  {
    id: "07",
    title: "Influencer Marketing & Media Planning",
    desc: "Collab sourcing, outreach and media planning that reaches audiences who already trust someone.",
  },
  {
    id: "08",
    title: "Digital Strategy & Organic Growth",
    desc: "Content strategy and organic growth planning that compounds — the system behind every number here.",
  },
];

const platforms = [
  { name: "Instagram", icon: Instagram, stat: "336K followers managed" },
  { name: "Facebook", icon: Facebook, stat: "Meta ads built to convert" },
  { name: "YouTube", icon: Youtube, stat: "96.6K subscribers managed" },
];

export function Services() {
  return (
    <section
      id="services"
      className="py-24 md:py-32 relative border-t border-white/5 section-cv"
    >
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="max-w-3xl mb-14">
          <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
            What we do
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-5">
            Everything your brand needs to scale.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Instagram page management, Reels production, Meta ads, influencer marketing —
            delivered as one connected system, not a menu of add-ons.
          </p>
        </Reveal>

        {/* 8 services — number, title, one line. Hairline grid via gap-px over a
            faint fill; no hover-swapping visual panel. */}
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.07] rounded-2xl overflow-hidden border border-white/[0.08] mb-16">
            {services.map((s) => (
              <div
                key={s.id}
                className="bg-[var(--color-void-black)] hover:bg-white/[0.03] transition-colors p-7 md:p-8 flex gap-5"
              >
                <span className="font-display font-bold text-lg text-[var(--color-violet-light)] tabular-nums shrink-0">
                  {s.id}
                </span>
                <div>
                  <h3 className="text-lg font-display font-bold text-white mb-1.5">{s.title}</h3>
                  <p className="text-sm text-white/65 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Platforms strip — merged from the old Platforms section. Three logos,
            one stat each. */}
        <Reveal>
          <div className="liquid-glass rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              {platforms.map(({ name, icon: Icon, stat }) => (
                <div
                  key={name}
                  className="flex items-center gap-4 pt-6 first:pt-0 sm:pt-0 sm:px-6 sm:first:pl-0"
                >
                  <span className="w-11 h-11 rounded-xl liquid-glass-lite flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-white" />
                  </span>
                  <div>
                    <div className="text-white font-display font-bold">{name}</div>
                    <div className="text-sm text-white/65">{stat}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
