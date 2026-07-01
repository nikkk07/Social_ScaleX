import React, { useState } from "react";
import { GlassCard } from "../GlassCard";

export function Contact() {
  const [activeTab, setActiveTab] = useState<"callback" | "query">("callback");

  return (
    <section id="contact" className="py-24 md:py-32 dark-section relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[var(--color-violet)] rounded-full mix-blend-screen filter blur-[150px] opacity-20 translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          <div className="w-full lg:w-1/2">
            <span className="text-[var(--color-amber)] font-medium tracking-wider uppercase text-sm mb-4 block">Ready to scale?</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">Let's build something your audience can't ignore.</h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-lg">
              Your first strategy call is free. No pitch decks, no pressure — just an honest conversation about what growth looks like for your brand.
            </p>
          </div>

          <div className="w-full lg:w-1/2">
            <GlassCard theme="dark" className="p-2">
              <div className="bg-black/20 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/5">
                
                {/* Tabs */}
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => setActiveTab("callback")}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "callback" ? "text-white bg-white/5" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
                  >
                    Request a callback
                  </button>
                  <button
                    onClick={() => setActiveTab("query")}
                    className={`flex-1 py-4 text-center font-medium transition-colors border-l border-white/10 ${activeTab === "query" ? "text-white bg-white/5" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
                  >
                    Send a query
                  </button>
                </div>

                <div className="p-8">
                  {activeTab === "callback" ? (
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Your name</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-violet)] transition-colors" placeholder="Your Name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Phone number</label>
                        <input type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-violet)] transition-colors" placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Best time to call (optional)</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-violet)] transition-colors" placeholder="e.g. Tomorrow afternoon" />
                      </div>
                      <button className="w-full bg-white text-ink font-bold py-4 rounded-xl hover:bg-white/90 transition-colors shadow-xl">
                        Request a callback
                      </button>
                      <p className="text-xs text-white/40 text-center">We usually call back within a few hours, during business hours.</p>
                    </form>
                  ) : (
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Your name</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-violet)] transition-colors" placeholder="Your Name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
                        <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-violet)] transition-colors" placeholder="your_email@gmail.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">What do you need help with?</label>
                        <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-violet)] transition-colors resize-none" placeholder="Tell us about your brand..." />
                      </div>
                      <button className="w-full bg-[var(--color-violet)] text-white font-bold py-4 rounded-xl hover:bg-[var(--color-violet)]/90 transition-colors shadow-xl shadow-[var(--color-violet)]/20">
                        Send query
                      </button>
                    </form>
                  )}
                </div>

              </div>
            </GlassCard>
          </div>

        </div>
      </div>
    </section>
  );
}
