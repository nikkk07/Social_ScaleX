import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ActionBar } from './ActionBar';

/** Chrome shared by every public page. Server component. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <ActionBar />
    </div>
  );
}
