'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: '+180', label: 'barberías activas' },
  { value: '+8.000', label: 'turnos gestionados' },
];

export default function Metrics() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-item', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#111111] border-t border-b border-[rgba(255,255,255,0.06)]"
      style={{ padding: '80px 0' }}
    >
      <div
        className="max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-center items-center"
        style={{ gap: 80, padding: '0 clamp(24px, 5vw, 80px)' }}
      >
        {stats.map((s) => (
          <div key={s.label} className="stat-item text-center">
            <div className="font-space font-bold text-[clamp(36px,4vw,56px)] text-[#f1f1f1]">
              {s.value}
            </div>
            <div className="font-inter text-[14px] text-[#888888] mt-2">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
