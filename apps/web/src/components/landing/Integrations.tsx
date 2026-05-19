'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Globe } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Integrations() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.browser-msg', {
        y: 20,
        opacity: 0,
        duration: 0.6,
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
      className="w-full bg-[#0a0a0a]"
      style={{ padding: 'clamp(80px, 10vw, 120px) 0' }}
    >
      <div className="max-w-[720px] mx-auto text-center browser-msg" style={{ padding: '0 clamp(24px, 5vw, 80px)' }}>
        <Globe size={48} className="mx-auto text-[#D4AF37] mb-6" strokeWidth={1.2} />
        <h2 className="font-space font-bold text-[clamp(28px,3.5vw,40px)] text-[#f1f1f1] leading-[1.1]">
          Funciona desde el navegador.
        </h2>
        <p className="font-inter text-[18px] text-[#888888] mt-4">
          Sin instalaciones, sin integraciones complicadas. Tus clientes reservan desde su celular. Vos gestionás todo desde una web.
        </p>
      </div>
    </section>
  );
}
