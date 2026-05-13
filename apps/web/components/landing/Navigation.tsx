'use client';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Funciones', href: '#features' },
    { label: 'Precios', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[rgba(10,10,10,0.85)] backdrop-blur-[12px]' : 'bg-transparent'
      }`}
      style={{ height: 64 }}
    >
      <div className="max-w-[1280px] mx-auto h-full flex items-center justify-between" style={{ padding: '0 clamp(24px, 5vw, 80px)' }}>
        <a href="#" className="font-space text-[20px] font-bold text-[#f1f1f1] tracking-[0.05em]">
          FILO
        </a>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-inter text-[13px] font-medium uppercase tracking-[0.1em] text-[#888888] hover:text-[#D4AF37] transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>
        <a
          href="/auth/signup"
          className="hidden md:block font-inter text-[13px] font-medium uppercase tracking-[0.1em] text-[#f1f1f1] border border-[rgba(255,255,255,0.15)] px-6 py-2.5 rounded-full hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.3)] transition-all duration-300"
        >
          Empezar gratis
        </a>
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <span className={`block w-5 h-[1.5px] bg-[#f1f1f1] transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[4.5px]' : ''}`} />
          <span className={`block w-5 h-[1.5px] bg-[#f1f1f1] transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-[1.5px] bg-[#f1f1f1] transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[4.5px]' : ''}`} />
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[64px] bg-[rgba(10,10,10,0.97)] backdrop-blur-[20px] flex flex-col items-center pt-16 gap-8 z-40">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-inter text-[16px] font-medium uppercase tracking-[0.1em] text-[#888888] hover:text-[#D4AF37] transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/auth/signup"
            onClick={() => setMenuOpen(false)}
            className="font-inter text-[14px] font-medium uppercase tracking-[0.1em] text-[#0a0a0a] bg-[#D4AF37] px-8 py-3 rounded-full mt-4"
          >
            Empezar gratis
          </a>
        </div>
      )}
    </nav>
  );
}
