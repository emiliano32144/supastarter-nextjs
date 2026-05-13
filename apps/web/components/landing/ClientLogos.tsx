'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ClientLogos() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.client-text', {
        y: 15,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#0a0a0a] border-t border-b border-[rgba(255,255,255,0.06)]"
      style={{ padding: '50px 0' }}
    >
      <div className="max-w-[1280px] mx-auto text-center client-text" style={{ padding: '0 clamp(24px, 5vw, 80px)' }}>
        <p className="font-inter text-[14px] text-[#888888]">
          Usado por barberías independientes en España y Argentina
        </p>
      </div>
    </section>
  );
}
