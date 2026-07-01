import React from "react";
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
import { Contact } from "./components/sections/Contact";
import { Footer } from "./components/sections/Footer";

export function Root() {
  return (
    <div className="font-sans antialiased text-ink bg-[var(--color-paper-white)]">
      <Navbar />
      <main>
        <Hero />
        <MarqueeStrip />
        <StatsBand />
        <Work />
        <Services />
        <Platforms />
        <Process />
        <Results />
        <WhyUs />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
