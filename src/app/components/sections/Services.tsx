import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "../GlassCard";
import { motion, AnimatePresence } from "motion/react";

const services = [
  {
    id: "01",
    title: "Instagram Page Management",
    desc: "Full-stack presence — feed, Reels, Stories, and Collabs — engineered for the Explore algorithm, end to end.",
    badge: "336K Followers managed",
    gradient: "from-purple-500/30 to-fuchsia-500/30",
  },
  {
    id: "02",
    title: "Content Creation",
    desc: "Reels, Posts, Explanatory Videos, and Shorts — scroll-stopping creative produced and edited in-house.",
    badge: "Reels + Posts",
    gradient: "from-blue-500/30 to-cyan-500/30",
  },
  {
    id: "03",
    title: "Paid Ads Management",
    desc: "Campaign architecture, targeting, and creative testing across Meta and YouTube — built to convert, not just reach.",
    badge: "Lead Gen Focused",
    gradient: "from-emerald-500/30 to-teal-500/30",
  },
  {
    id: "04",
    title: "Profile Optimization",
    desc: "Bio, link-in-bio, highlights, and channel layout — optimized so visitors convert into followers and customers.",
    badge: "100% Brand-aligned",
    gradient: "from-amber-500/30 to-orange-500/30",
  },
  {
    id: "05",
    title: "Analytics & Reporting",
    desc: "Real dashboards from real client accounts — views, watch time, subscriber velocity — reviewed weekly, not guessed.",
    badge: "227.5K Views, 28 days",
    gradient: "from-indigo-500/30 to-blue-500/30",
  },
  {
    id: "06",
    title: "Product Photoshoots & Shoots",
    desc: "Product photoshoots, event shoots, teasers, and on-location social media shoots — content captured, not stocked.",
    badge: "On location Shoots",
    gradient: "from-rose-500/30 to-pink-500/30",
  },
  {
    id: "07",
    title: "Influencer Marketing & Media Planning",
    desc: "Collab sourcing, outreach, and media planning that puts your brand in front of audiences that already trust someone.",
    badge: "Partnerships Sourced",
    gradient: "from-violet-500/30 to-purple-500/30",
  },
  {
    id: "08",
    title: "Digital Strategy & Organic Growth",
    desc: "Content strategy and organic growth planning that compounds — the system behind every number on this page.",
    badge: "Strategy First",
    gradient: "from-sky-500/30 to-blue-500/30",
  },
];

export function Services() {
  const [activeTab, setActiveTab] = useState(services[0]?.id ?? "");
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll-based: whichever item's center is closest to the viewport center becomes active.
  // This prevents premature expansion/collapse — the item must physically be at center to win.
  useEffect(() => {
    let rafId: number;

    const update = () => {
      const mid = window.innerHeight / 2;
      let closestIdx = 0;
      let closestDist = Infinity;

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const elMid = rect.top + rect.height / 2;
        const dist = Math.abs(elMid - mid);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });

      const active = services[closestIdx];
      if (active) setActiveTab(active.id);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // set correct active on mount

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const activeService = services.find((s) => s.id === activeTab)!;

  return (
    <section
      id="services"
      className="py-24 md:py-32 relative border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
            What we do
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Everything your brand needs to scale.
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Instagram page management, Reels production, Meta ads, influencer
            marketing — delivered as one connected system, not a menu of add-ons.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left: scrollable list ── */}
          {/* pb-[55vh] gives the last item room to reach the viewport center */}
          <div className="w-full lg:w-1/2 pb-[55vh]">
            {services.map((service, i) => {
              const isActive = activeTab === service.id;
              return (
                <div
                  key={service.id}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className="mb-2"
                >
                  <button
                    onClick={() => setActiveTab(service.id)}
                    className={`w-full text-left p-6 rounded-2xl transition-all duration-300 border ${
                      isActive
                        ? "liquid-glass shadow-lg shadow-black/20"
                        : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span
                        className={`font-display font-bold text-xl transition-colors duration-300 min-w-[2.5rem] ${
                          isActive
                            ? "text-[var(--color-emerald)]"
                            : "text-white/30"
                        }`}
                      >
                        {service.id}
                      </span>
                      <h3
                        className={`text-xl font-display font-bold flex-1 transition-colors duration-300 ${
                          isActive ? "text-white" : "text-white/60"
                        }`}
                      >
                        {service.title}
                      </h3>
                    </div>

                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.35,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          className="overflow-hidden"
                        >
                          <p className="text-white/65 leading-relaxed ml-14 mt-4 pr-4">
                            {service.desc}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Right: sticky visual panel (desktop only) ── */}
          <div className="hidden lg:block w-full lg:w-1/2 sticky top-28 self-start h-[520px]">
            <GlassCard className="w-full h-full p-2" tiltMax={4}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeService.id}
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.02, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className={`w-full h-full rounded-2xl bg-gradient-to-br ${activeService.gradient} relative overflow-hidden flex flex-col items-center justify-center border border-white/10`}
                >
                  {/* Ambient blobs */}
                  <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white/20 rounded-full mix-blend-overlay blur-2xl pointer-events-none" />
                  <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-black/20 rounded-full mix-blend-overlay blur-3xl pointer-events-none" />

                  {/* Service label */}
                  <div className="absolute top-6 left-7 z-10">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                      {activeService.id}
                    </span>
                    <p className="text-white font-display font-bold text-base mt-1 max-w-[220px] leading-snug">
                      {activeService.title}
                    </p>
                  </div>

                  {/* Mock UI card */}
                  <div className="relative z-10 bg-black/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl w-3/4 max-w-sm">
                    <div className="flex items-center space-x-1.5 mb-5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-1/3 bg-white/20 rounded-full" />
                      <div className="h-20 w-full bg-white/10 rounded-xl" />
                      <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                      <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                    </div>
                  </div>

                  {/* Badge */}
                  <motion.div
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="absolute bottom-7 right-7 bg-white text-[#0B0A10] px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--color-emerald)] animate-pulse shrink-0" />
                    <span>{activeService.badge}</span>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
