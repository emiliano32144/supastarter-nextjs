'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, Users, BookOpen } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Clock,
    title: 'Turnos online 24/7',
    desc: 'Tu página de reservas está siempre activa. El cliente elige servicio, profesional, día y hora. Vos recibís la notificación y listo.',
  },
  {
    icon: Users,
    title: 'Confirmación automática',
    desc: 'Cada reserva requiere confirmación por email. Cero reservas falsas, cero no-shows sorpresa. El sistema filtra solo a los clientes reales.',
  },
  {
    icon: BookOpen,
    title: 'Historial de clientes',
    desc: 'Cada cliente queda registrado automáticamente con su historial de visitas y preferencias.',
  },
];

export default function FeatureHighlights() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
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
      id="features"
      className="w-full bg-[#0a0a0a]"
      style={{ padding: 'clamp(80px, 10vw, 120px) 0' }}
    >
      <div className="max-w-[1280px] mx-auto" style={{ padding: '0 clamp(24px, 5vw, 80px)' }}>
        <p className="font-inter text-[12px] font-medium uppercase tracking-[0.12em] text-[#D4AF37] mb-4">
          PLATAFORMA
        </p>
        <h2 className="font-space font-bold text-[clamp(32px,4vw,48px)] text-[#f1f1f1] leading-[1.1] mb-16">
          Todo lo que tu
          <br />
          barbería necesita.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 32 }}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="feature-card bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-10 hover:border-[rgba(212,175,55,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300"
              >
                <Icon size={24} stroke="#D4AF37" strokeWidth={1.5} />
                <h3 className="font-space font-semibold text-[20px] text-[#f1f1f1] mt-6 mb-3">
                  {f.title}
                </h3>
                <p className="font-inter text-[15px] text-[#888888] leading-[1.65]">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
