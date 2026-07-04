import React, { useState } from "react";
import { GlassCard } from "../GlassCard";
import { Reveal } from "../effects/Reveal";

const inputClasses =
  "w-full liquid-glass-inset rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-violet-light)] transition-colors";

export function Contact() {
  const [activeTab, setActiveTab] = useState<"callback" | "query">("callback");

  return (
    <section id="contact" aria-label="Contact Social ScaleX" className="py-24 md:py-32 relative border-t border-white/5 section-cv">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">

          <Reveal className="w-full lg:w-1/2">
            <span className="text-[var(--color-amber)] font-medium tracking-wider uppercase text-sm mb-4 block">Ready to scale?</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">Let's build something your audience can't ignore.</h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-lg">
              Your first strategy call is free. No pitch decks, no pressure — just an honest conversation about what growth looks like for your brand.
            </p>
          </Reveal>

          <Reveal className="w-full lg:w-1/2" delay={0.15}>
            <GlassCard className="p-2" tiltMax={3}>
              <div className="rounded-3xl overflow-hidden">

                {/* Tabs */}
                <div className="flex border-b border-white/10 relative">
                  <button
                    onClick={() => setActiveTab("callback")}
                    className={`flex-1 py-4 text-center font-medium transition-colors relative ${activeTab === "callback" ? "text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    Request a callback
                    {activeTab === "callback" && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-emerald)] rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("query")}
                    className={`flex-1 py-4 text-center font-medium transition-colors border-l border-white/10 relative ${activeTab === "query" ? "text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    Send a query
                    {activeTab === "query" && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-emerald)] rounded-full" />
                    )}
                  </button>
                </div>

                <div className="p-8">
                  {activeTab === "callback" ? (
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Your name</label>
                        <input type="text" autoComplete="name" className={inputClasses} placeholder="Your Name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Phone number</label>
                        <input type="tel" autoComplete="tel" className={inputClasses} placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Best time to call (optional)</label>
                        <input type="text" className={inputClasses} placeholder="e.g. Tomorrow afternoon" />
                      </div>
                      <button className="shine-sweep w-full bg-white text-[#0B0A10] font-bold py-4 rounded-xl hover:bg-white/90 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl">
                        Request a callback
                      </button>
                      <p className="text-xs text-white/40 text-center">We usually call back within a few hours, during business hours.</p>
                    </form>
                  ) : (
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Your name</label>
                        <input type="text" autoComplete="name" className={inputClasses} placeholder="Your Name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
                        <input type="email" autoComplete="email" className={inputClasses} placeholder="your_email@gmail.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">What do you need help with?</label>
                        <textarea rows={3} className={`${inputClasses} resize-none`} placeholder="Tell us about your brand..." />
                      </div>
                      <button className="shine-sweep w-full bg-gradient-to-r from-[var(--color-violet)] to-[#6D28D9] text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-[var(--color-violet)]/25 border border-white/20">
                        Send query
                      </button>
                    </form>
                  )}
                </div>

              </div>
            </GlassCard>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
