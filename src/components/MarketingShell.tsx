import React from 'react';
import { LiquidBackground } from './effects/LiquidBackground';
import { MotionProvider } from './motion/MotionProvider';
import { Navbar } from './sections/Navbar';
import { Footer } from './sections/Footer';

/**
 * Chrome shared by every public page: background wash, floating nav, skip
 * link and footer. A server component — only the Navbar inside it is a client
 * component, and only because of the mobile menu and the scroll state.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative font-sans antialiased text-ink bg-base-950">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <LiquidBackground />
      {/* Mounted here, not in the root layout, so the CRM never loads it. */}
      <MotionProvider />
      <Navbar />
      <main id="main-content" className="relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
