'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Hero() {
  const labelRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(labelRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0)
      .to(headRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.15)
      .to(subRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.3)
      .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.45);
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden flex items-end justify-center">
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.7) 70%, rgba(10,10,10,0.95) 100%)',
        }}
      />
      <div className="relative z-[2] text-center max-w-[800px]" style={{ padding: '0 24px', paddingBottom: '15vh' }}>
        <div
          ref={labelRef}
          className="font-inter text-[13px] font-medium uppercase tracking-[0.15em] text-[#D4AF37] mb-6 opacity-0 translate-y-5"
        >
          SISTEMA DE RESERVAS PARA BARBERÍAS
        </div>
        <h1
          ref={headRef}
          className="font-space font-bold text-[clamp(40px,5vw,64px)] text-[#f1f1f1] leading-[1.1] opacity-0 translate-y-5"
        >
          Tu barbería, siempre llena.
          <br />
          Sin llamadas, sin caos.
        </h1>
        <p
          ref={subRef}
          className="font-inter text-[18px] text-[#888888] max-w-[520px] mx-auto mt-5 opacity-0 translate-y-5"
        >
          FILO es el sistema de turnos online para barberías. Tus clientes reservan solos, vos solo cortás.
        </p>
        <a
          ref={ctaRef}
          href="/auth/signup"
          className="inline-block mt-9 font-inter text-[14px] font-semibold text-[#0a0a0a] bg-[#D4AF37] px-9 py-3.5 rounded-full hover:bg-[#E5C158] hover:scale-[1.03] transition-all duration-300 opacity-0 translate-y-5"
        >
          Probar gratis 14 días
        </a>
        <p className="font-inter text-[13px] text-[#666666] mt-3">
          Sin tarjeta de crédito. Sin permanencia.
        </p>
      </div>
    </section>
  );
}
