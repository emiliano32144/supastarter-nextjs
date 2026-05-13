'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const checklist = [
  'Recordatorios por email 24h antes de la cita',
  'El cliente puede cancelar desde el mismo email',
  'Tu calendario siempre actualizado automáticamente',
];

export default function FeatureShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(leftRef.current, {
        x: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });
      gsap.from(rightRef.current, {
        x: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#0a0a0a]"
      style={{ padding: 'clamp(80px, 10vw, 120px) 0' }}
    >
      <div
        className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center"
        style={{ gap: 80, padding: '0 clamp(24px, 5vw, 80px)' }}
      >
        <div ref={leftRef}>
          <p className="font-inter text-[12px] font-medium uppercase tracking-[0.12em] text-[#D4AF37]">
            AUTOMATIZACIÓN INTELIGENTE
          </p>
          <h2 className="font-space font-bold text-[clamp(32px,3.5vw,44px)] text-[#f1f1f1] leading-[1.1] mt-4">
            Recordatorios automáticos.
            <br />
            Olvidate de las ausencias.
          </h2>
          <p className="font-inter text-[16px] text-[#888888] leading-[1.65] mt-6">
            FILO envía recordatorios por email automáticamente. Los clientes confirman su reserva con un clic. Tu calendario se mantiene preciso sin levantar un dedo.
          </p>
          <ul className="mt-8 space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check size={16} stroke="#D4AF37" strokeWidth={2} />
                <span className="font-inter text-[15px] text-[#f1f1f1]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div ref={rightRef}>
          <img
            src="/images/barbershop-interior.jpg"
            alt="Interior de barbería moderna"
            className="w-full rounded-2xl object-cover border border-[rgba(255,255,255,0.08)]"
            style={{ aspectRatio: '4/3' }}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
