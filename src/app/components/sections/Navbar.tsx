import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { name: "Work", href: "#work" },
    { name: "Services", href: "#services" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <>
      {/* Floating glass capsule */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
      >
        <div
          className={`liquid-glass-strong rounded-full flex items-center justify-between pl-6 pr-2 transition-all duration-500 ${
            scrolled ? "h-14 shadow-2xl shadow-black/40" : "h-16"
          }`}
        >
          {/* Logo */}
          <a
            href="/"
            aria-label="Social ScaleX home"
            className="flex-shrink-0 text-xl font-bold font-display tracking-tight text-white z-50 relative"
          >
            Social <span className="text-gradient">ScaleX</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
            <a
              href="#contact"
              className="shine-sweep ml-2 bg-white text-[#0B0A10] px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-all duration-200 hover:scale-[1.04] active:scale-95"
            >
              Start growing
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-3 text-white z-50 relative"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 liquid-glass-strong flex flex-col justify-center items-center px-6 z-40 md:hidden"
          >
            <div className="flex flex-col space-y-6 items-center w-full">
              {links.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.08 * i, duration: 0.5 }}
                  className="text-3xl font-display font-bold text-white"
                >
                  {link.name}
                </motion.a>
              ))}
              <motion.a
                href="#contact"
                onClick={() => setIsOpen(false)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full max-w-xs text-center bg-white text-[#0B0A10] px-8 py-4 rounded-full font-semibold text-lg mt-6"
              >
                Start growing
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
