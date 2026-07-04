import React from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../effects/Reveal";
import { MagneticButton } from "../effects/MagneticButton";

export function WhyUs() {
  const points = [
    {
      num: "01",
      title: "Strategy before everything",
      desc: "Every post has a defined goal, tested format, and measured outcome. We never create content to 'fill the calendar.'"
    },
    {
      num: "02",
      title: "Algorithm-first thinking",
      desc: "Our team monitors every platform update in real time. Your content always rides the algorithm — never fights it."
    },
    {
      num: "03",
      title: "Revenue tied to social",
      desc: "We track followers but optimize for customers. Every metric connects back to business outcomes: leads, sales, retention."
    },
    {
      num: "04",
      title: "Radical transparency",
      desc: "Real-time dashboards, weekly calls, honest reporting. We show you what's working and what isn't — always."
    }
  ];

  return (
    <section id="why-us" aria-label="Why Social ScaleX" className="py-24 md:py-32 relative border-t border-white/5 section-cv">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* Left Column (Sticky) */}
          <div className="w-full lg:w-5/12">
            <div className="sticky top-32">
              <Reveal>
                <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">Why Social ScaleX</span>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">We treat your brand like our own.</h2>
                <p className="text-white/60 text-lg leading-relaxed mb-8">
                  Most agencies post content. We build systems that compound — where each month's results make next month's easier.
                </p>
                <MagneticButton
                  href="#contact"
                  className="shine-sweep inline-flex items-center space-x-2 bg-white text-[#0B0A10] px-8 py-4 rounded-full font-semibold shadow-[0_8px_32px_rgba(255,255,255,0.15)]"
                >
                  <span>Let's talk strategy</span>
                  <ArrowRight size={18} />
                </MagneticButton>
              </Reveal>
            </div>
          </div>

          {/* Right Column (Scrollable List) */}
          <div className="w-full lg:w-7/12">
            <div className="space-y-6">
              {points.map((point, i) => (
                <Reveal key={point.num} delay={i * 0.08}>
                  <div className="liquid-glass rounded-3xl p-8 flex flex-col md:flex-row gap-6 md:gap-8 group transition-transform duration-300 hover:scale-[1.015]">
                    <div className="text-5xl font-display font-bold text-white/10 group-hover:text-gradient group-hover:opacity-100 transition-all duration-300 shrink-0">
                      {point.num}
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3">{point.title}</h3>
                      <p className="text-white/60 leading-relaxed text-lg">{point.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
