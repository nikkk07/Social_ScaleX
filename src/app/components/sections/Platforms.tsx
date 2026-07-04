import React from "react";
import { GlassCard } from "../GlassCard";
import { Reveal } from "../effects/Reveal";
import { CheckCircle2 } from "lucide-react";
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";

export function Platforms() {
  const platforms = [
    {
      name: "Instagram",
      icon: <FaInstagram size={26} className="text-white" />,
      orb: "from-fuchsia-500/60 to-amber-500/50",
      users: "2 billion monthly users.",
      desc: "Feed curation, Reels strategy, Stories, Collabs — we know the algorithm and work with it, not against it.",
      features: [
        "Reels & Shorts strategy",
        "Explore page optimization",
        "Hashtag architecture",
        "Story sequence design"
      ],
      stat: "336K followers on a single managed account."
    },
    {
      name: "Facebook",
      icon: <FaFacebook size={26} className="text-white" />,
      orb: "from-blue-500/60 to-cyan-500/50",
      users: "3 billion monthly users.",
      desc: "Precision-targeted ads, retargeting funnels, and creative testing at scale — every rupee working harder.",
      features: [
        "Campaign architecture",
        "Lookalike audiences",
        "Creative A/B testing",
        "Retargeting sequences"
      ],
      stat: "Lead Gen, ads built to convert, not just reach."
    },
    {
      name: "YouTube",
      icon: <FaYoutube size={26} className="text-white" />,
      orb: "from-red-500/60 to-rose-500/50",
      users: "2.7 billion monthly users.",
      desc: "SEO-led content strategy, Shorts flywheel, thumbnail science, and channel authority building that compounds.",
      features: [
        "Video SEO & scripting",
        "Thumbnail A/B testing",
        "Shorts strategy",
        "Subscriber velocity"
      ],
      stat: "96.6K subscribers on a single managed channel."
    }
  ];

  return (
    <section id="platforms" aria-label="Platforms we manage" className="py-24 md:py-32 relative border-t border-white/5 section-cv">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="max-w-3xl mb-16 text-center mx-auto flex flex-col items-center">
          <span className="liquid-glass-lite text-[var(--color-emerald)] font-medium tracking-wider uppercase text-sm mb-4 block px-4 py-1.5 rounded-full">Platforms we master</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Dominate where your audience lives.</h2>
          <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
            We go deep, not wide. Three platforms, obsessively mastered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {platforms.map((platform, i) => (
            <Reveal key={platform.name} delay={i * 0.12}>
            <GlassCard className="p-8 flex flex-col h-full">
              <div className="mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${platform.orb} border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center mb-5`}>
                  {platform.icon}
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-1">{platform.name}</h3>
                <p className="text-[var(--color-violet-light)] font-medium text-sm mb-4">{platform.users}</p>
                <p className="text-white/70 text-sm leading-relaxed mb-8">{platform.desc}</p>
              </div>

              <div className="flex-1">
                <ul className="space-y-3 mb-8">
                  {platform.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <CheckCircle2 size={16} className="text-[var(--color-emerald)] mt-0.5 shrink-0" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-white/10 mt-auto">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Proven Result</p>
                <p className="text-white font-bold text-sm">{platform.stat}</p>
              </div>
            </GlassCard>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
