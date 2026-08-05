import React, { Suspense, lazy } from "react";
import { LiquidBackground } from "./components/effects/LiquidBackground";
import { Navbar } from "./components/sections/Navbar";
import { Hero } from "./components/sections/Hero";
import { StatsBand } from "./components/sections/StatsBand";
import { Work } from "./components/sections/Work";
import { Services } from "./components/sections/Services";
import { Process } from "./components/sections/Process";
import { WhyUs } from "./components/sections/WhyUs";
import { FAQ } from "./components/sections/FAQ";
import { Footer } from "./components/sections/Footer";

// Below-the-fold, and the only marketing consumer of react-hook-form + zod.
// Split it out so those deps stay out of the homepage's initial chunk.
const Contact = lazy(() =>
  import("./components/sections/Contact").then((m) => ({ default: m.Contact })),
);

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
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <Contact />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
