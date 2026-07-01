import React from "react";
import { ArrowRight } from "lucide-react";

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
    <section className="py-24 md:py-32 light-section relative border-t border-ink/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Left Column (Sticky) */}
          <div className="w-full lg:w-5/12">
            <div className="sticky top-32">
              <span className="text-[var(--color-violet)] font-medium tracking-wider uppercase text-sm mb-4 block">Why Social ScaleX</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-ink mb-6">We treat your brand like our own.</h2>
              <p className="text-ink/70 text-lg leading-relaxed mb-8">
                Most agencies post content. We build systems that compound — where each month's results make next month's easier.
              </p>
              <a href="#contact" className="inline-flex items-center space-x-2 bg-[var(--color-ink)] hover:bg-black text-white px-8 py-4 rounded-full font-medium transition-colors shadow-lg">
                <span>Let's talk strategy</span>
                <ArrowRight size={18} />
              </a>
            </div>
          </div>

          {/* Right Column (Scrollable List) */}
          <div className="w-full lg:w-7/12">
            <div className="space-y-12">
              {points.map((point) => (
                <div key={point.num} className="flex flex-col md:flex-row gap-6 md:gap-8 group">
                  <div className="text-5xl font-display font-bold text-ink/10 group-hover:text-[var(--color-violet)] transition-colors duration-300">
                    {point.num}
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-ink mb-3">{point.title}</h3>
                    <p className="text-ink/70 leading-relaxed text-lg">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
