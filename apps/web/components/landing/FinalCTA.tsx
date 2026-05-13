'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function FinalCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cta-head', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
      gsap.from('.cta-sub', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
      gsap.from('.cta-btn', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.3,
        ease: 'power3.out',
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
      id="cta"
      className="w-full bg-[#0a0a0a] text-center"
      style={{
        padding: 'clamp(80px, 10vw, 120px) 0',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(212, 175, 55, 0.08) 0%, transparent 60%)',
      }}
    >
      <div className="max-w-[720px] mx-auto" style={{ padding: '0 clamp(24px, 5vw, 80px)' }}>
        <h2 className="cta-head font-space font-bold text-[clamp(36px,4.5vw,56px)] text-[#f1f1f1] leading-[1.1]">
          ¿Listo para modernizar
          <br />
          tu barbería?
        </h2>
        <p className="cta-sub font-inter text-[18px] text-[#888888] mt-5 max-w-[520px] mx-auto">
          Empezá hoy. 14 días gratis. Sin tarjeta de crédito.
        </p>
        <a
          href="/auth/signup"
          className="cta-btn inline-block mt-9 font-inter text-[15px] font-semibold text-[#0a0a0a] bg-[#D4AF37] px-10 py-4 rounded-full hover:bg-[#E5C158] hover:scale-[1.03] transition-all duration-300"
        >
          Crear mi cuenta gratis
        </a>
        <p className="font-inter text-[13px] text-[#666666] mt-4">
          No se requiere tarjeta de crédito. Cancelá cuando quieras.
        </p>
      </div>
    </section>
  );
}
