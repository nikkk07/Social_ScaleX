import React from "react";
import { Toaster } from "sonner";
import { LiquidBackground } from "./components/effects/LiquidBackground";
import { Navbar } from "./components/sections/Navbar";
import { Hero } from "./components/sections/Hero";
import { StatsBand } from "./components/sections/StatsBand";
import { Work } from "./components/sections/Work";
import { Services } from "./components/sections/Services";
import { Process } from "./components/sections/Process";
import { WhyUs } from "./components/sections/WhyUs";
import { FAQ } from "./components/sections/FAQ";
import { Contact } from "./components/sections/Contact";
import { Footer } from "./components/sections/Footer";

export function Root() {
  return (
    <div className="relative font-sans antialiased text-[var(--color-ink)] bg-[var(--color-void-black)]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <LiquidBackground />
      <Navbar />
      <main id="main-content" className="relative z-10">
        <Hero />
        <StatsBand />
        <Work />
        <Services />
        <Process />
        <WhyUs />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <Toaster position="bottom-center" theme="dark" richColors />
    </div>
  );
}
