import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Work", href: "#work" },
    { name: "Services", href: "#services" },
    { name: "Platforms", href: "#platforms" },
    { name: "Results", href: "#results" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel-light border-b border-black/6">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex-shrink-0 text-2xl font-bold font-display tracking-tight text-ink z-50 relative">
          Social <span className="text-gradient">ScaleX</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[var(--color-ink)] font-medium hover:text-[var(--color-violet)] transition-colors"
            >
              {link.name}
            </a>
          ))}
          <a
            href="#contact"
            className="bg-[var(--color-ink)] text-white px-6 py-3 rounded-full font-medium hover:bg-black transition-colors"
          >
            Start growing
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-ink z-50 relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 glass-panel-light flex flex-col justify-center items-center pt-20 px-6 z-40"
            >
              <div className="flex flex-col space-y-8 items-center w-full">
                {links.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-3xl font-display font-bold text-ink"
                  >
                    {link.name}
                  </a>
                ))}
                <a
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center bg-ink text-white px-8 py-4 rounded-full font-medium text-lg mt-8"
                >
                  Start growing
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
