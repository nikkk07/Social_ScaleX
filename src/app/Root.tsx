import React from "react";
import { SmoothScroll } from "./components/effects/SmoothScroll";
import { LiquidBackground } from "./components/effects/LiquidBackground";
import { Navbar } from "./components/sections/Navbar";
import { Hero } from "./components/sections/Hero";
import { MarqueeStrip } from "./components/sections/Marquee";
import { StatsBand } from "./components/sections/StatsBand";
import { Work } from "./components/sections/Work";
import { Services } from "./components/sections/Services";
import { Platforms } from "./components/sections/Platforms";
import { Process } from "./components/sections/Process";
import { Results } from "./components/sections/Results";
import { WhyUs } from "./components/sections/WhyUs";
import { FAQ } from "./components/sections/FAQ";
import { Contact } from "./components/sections/Contact";
import { Footer } from "./components/sections/Footer";

export function Root() {
  return (
    <SmoothScroll>
      <div className="relative font-sans antialiased text-[var(--color-ink)] bg-[var(--color-void-black)]">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <LiquidBackground />
        <Navbar />
        <main id="main-content" className="relative z-10">
          <Hero />
          <MarqueeStrip />
          <StatsBand />
          <Work />
          <Services />
          <Platforms />
          <Process />
          <Results />
          <WhyUs />
          <FAQ />
          <Contact />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
