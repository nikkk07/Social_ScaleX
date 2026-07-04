import React, { useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

interface LegalPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

/** Shared shell for Privacy / Terms — simple, readable, no heavy effects. */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${title} — Social ScaleX`;
    return () => {
      document.title = "Social ScaleX | Social Media Marketing Agency in Delhi NCR";
    };
  }, [title]);

  return (
    <div className="min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-white/60 hover:text-white transition-colors mb-10 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          <span>Back to Social ScaleX</span>
        </Link>

        <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3">{title}</h1>
        <p className="text-white/40 text-sm mb-12">Last updated: {updated}</p>

        <div className="space-y-8 text-white/70 leading-relaxed [&_h2]:text-white [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mb-3 [&_h2]:mt-2">
          {children}
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-sm text-white/50">
          Questions about this page? Call us at{" "}
          <a href="tel:+918077727669" className="text-[var(--color-violet-light)] hover:underline">
            +91 80777 27669
          </a>{" "}
          or use the contact form on our homepage.
        </div>
      </div>
    </div>
  );
}
