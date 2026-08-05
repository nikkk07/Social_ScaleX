import React from "react";
import { Link } from "react-router";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import { WhatsappIcon } from "../icons/WhatsappIcon";

/*
 * Set these to the agency's real profile URLs when ready — icons for
 * empty entries are hidden automatically, so nothing ever links to "#".
 */
const SOCIAL_LINKS = [
  { name: "WhatsApp", url: "https://wa.me/918077727669", icon: WhatsappIcon },
  { name: "Instagram", url: "", icon: Instagram },
  { name: "LinkedIn", url: "", icon: Linkedin },
  { name: "YouTube", url: "", icon: Youtube },
];

export function Footer() {
  return (
    <footer className="relative z-10 pt-20 pb-10 border-t border-white/10 text-white section-cv">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">

          <div className="lg:col-span-2">
            <a href="/" aria-label="Social ScaleX home" className="inline-block text-2xl font-bold font-display tracking-tight text-white mb-4">
              Social <span className="text-gradient">ScaleX</span>
            </a>
            <p className="text-white/60 font-medium mb-2">
              Social media marketing agency, Delhi NCR.
            </p>
            <p className="text-white/50 text-sm mb-6">
              Instagram, Facebook &amp; YouTube growth for brands and creators — real clients, verified results.
            </p>
            <div className="flex items-center space-x-4">
              {SOCIAL_LINKS.filter((s) => s.url).map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Social ScaleX on ${s.name}`}
                  className="liquid-glass-lite w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 text-white/80 hover:text-white"
                >
                  <s.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Services">
            <h4 className="font-bold text-white mb-6">Services</h4>
            <ul className="space-y-3 text-white/60 text-sm">
              <li><a href="/#services" className="hover:text-[var(--color-violet-light)] transition-colors">Instagram Page Management</a></li>
              <li><a href="/#services" className="hover:text-[var(--color-violet-light)] transition-colors">Content Creation &amp; Reels</a></li>
              <li><a href="/#services" className="hover:text-[var(--color-violet-light)] transition-colors">Paid Ads Management</a></li>
              <li><a href="/#services" className="hover:text-[var(--color-violet-light)] transition-colors">Analytics &amp; Reporting</a></li>
              <li><a href="/#services" className="hover:text-[var(--color-violet-light)] transition-colors">Influencer Marketing</a></li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-3 text-white/60 text-sm">
              <li><a href="/#why-us" className="hover:text-[var(--color-violet-light)] transition-colors">About Us</a></li>
              <li><a href="/#work" className="hover:text-[var(--color-violet-light)] transition-colors">Client Portfolio</a></li>
              <li><a href="/#work" className="hover:text-[var(--color-violet-light)] transition-colors">Results</a></li>
              <li><a href="/#process" className="hover:text-[var(--color-violet-light)] transition-colors">Our Process</a></li>
              <li><a href="/#faq" className="hover:text-[var(--color-violet-light)] transition-colors">FAQ</a></li>
              <li>
                <a
                  href="https://forms.gle/uDWsX4886U4jGukK8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-violet-light)] transition-colors"
                >
                  Careers
                </a>
              </li>
            </ul>
          </nav>

          <address className="not-italic">
            <h4 className="font-bold text-white mb-6">Talk to us</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <div className="text-white/50 text-xs mb-1">Nikhil Bisht</div>
                <a href="tel:+918077727669" className="font-medium text-white hover:text-[var(--color-violet-light)] transition-colors">+91 80777 27669</a>
              </li>
              <li>
                <div className="text-white/50 text-xs mb-1">Abhishek Anand</div>
                <a href="tel:+917827810150" className="font-medium text-white hover:text-[var(--color-violet-light)] transition-colors">+91 78278 10150</a>
              </li>
              <li className="pt-2">
                <a href="/#contact" className="text-[var(--color-violet-light)] font-medium hover:underline">Send a query / request a callback</a>
              </li>
            </ul>
          </address>

        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-white/50">
          <div>&copy; {new Date().getFullYear()} Social ScaleX. All rights reserved.</div>
          <div className="flex items-center space-x-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
