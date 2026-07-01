import React from "react";
import { FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-[var(--color-paper-white)] pt-20 pb-10 border-t border-ink/10 text-ink">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          <div className="lg:col-span-2">
            <a href="#" className="inline-block text-2xl font-bold font-display tracking-tight text-ink mb-4">
              Social <span className="text-gradient">ScaleX</span>
            </a>
            <p className="text-ink/70 font-medium mb-6">We grow brands. Real clients, verified results.</p>
            <div className="flex items-center space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors text-ink">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors text-ink">
                <FaLinkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors text-ink">
                <FaYoutube size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-ink mb-6">Services</h4>
            <ul className="space-y-3 text-ink/70 text-sm">
              <li><a href="#" className="hover:text-[var(--color-violet)] transition-colors">Instagram Management</a></li>
              <li><a href="#" className="hover:text-[var(--color-violet)] transition-colors">Content Creation</a></li>
              <li><a href="#" className="hover:text-[var(--color-violet)] transition-colors">Paid Ads Management</a></li>
              <li><a href="#" className="hover:text-[var(--color-violet)] transition-colors">Analytics & Reporting</a></li>
              <li><a href="#" className="hover:text-[var(--color-violet)] transition-colors">Influencer Marketing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink mb-6">Company</h4>
            <ul className="space-y-3 text-ink/70 text-sm">
              <li><a href="#" className="hover:text-[var(--color-violet)] transition-colors">About</a></li>
              <li><a href="#work" className="hover:text-[var(--color-violet)] transition-colors">Client Portfolio</a></li>
              <li><a href="#results" className="hover:text-[var(--color-violet)] transition-colors">Results</a></li>
              <li><a href="#services" className="hover:text-[var(--color-violet)] transition-colors">Our Process</a></li>
              <li><a href="https://forms.gle/uDWsX4886U4jGukK8" className="hover:text-[var(--color-violet)] transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink mb-6">Talk to us</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <div className="text-ink/50 text-xs mb-1">Nikhil Bisht</div>
                <a href="tel:+918077727669" className="font-medium text-ink hover:text-[var(--color-violet)] transition-colors">+91 80777 27669</a>
              </li>
              <li>
                <div className="text-ink/50 text-xs mb-1">Abhishek Anand</div>
                <a href="tel:+917827810150" className="font-medium text-ink hover:text-[var(--color-violet)] transition-colors">+91 78278 10150</a>
              </li>
              <li className="pt-2">
                <a href="#contact" className="text-[var(--color-violet)] font-medium hover:underline">Send a query / request a callback</a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-ink/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-ink/50">
          <div>&copy; {new Date().getFullYear()} Social ScaleX. All rights reserved.</div>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-ink transition-colors">Privacy</a>
            <a href="#" className="hover:text-ink transition-colors">Terms</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
