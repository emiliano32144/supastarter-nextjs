'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: 'Normal',
    price: '€49,99',
    period: '/mes',
    features: [
      'Turnos online ilimitados',
      'Hasta 3 profesionales',
      'Confirmación por email',
      'Página de reservas personalizada',
      'Soporte por email',
    ],
    cta: 'Probar gratis 14 días',
    highlighted: false,
    note: null,
  },
  {
    name: 'Pro',
    price: '€95',
    period: '/mes',
    features: [
      'Todo lo del plan Normal',
      'Profesionales ilimitados',
      'Estadísticas avanzadas',
      'Recordatorios automáticos 24h antes',
      'Soporte prioritario',
    ],
    cta: 'Probar gratis 14 días',
    highlighted: true,
    note: 'RECOMENDADO',
  },
];

export default function Pricing() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.pricing-card', {
        scale: 0.95,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
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
      id="pricing"
      className="w-full bg-[#0a0a0a]"
      style={{ padding: 'clamp(80px, 10vw, 120px) 0' }}
    >
      <div className="max-w-[1080px] mx-auto text-center" style={{ padding: '0 clamp(24px, 5vw, 80px)' }}>
        <p className="font-inter text-[12px] font-medium uppercase tracking-[0.12em] text-[#D4AF37] mb-4">
          PRECIOS
        </p>
        <h2 className="font-space font-bold text-[clamp(32px,4vw,48px)] text-[#f1f1f1] leading-[1.1] mb-4">
          Sin letra chica.
          <br />
          Sin sorpresas.
        </h2>
        <p className="font-inter text-[16px] text-[#888888] mb-14">
          Probá gratis 14 días. Sin tarjeta de crédito.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-[720px] mx-auto" style={{ gap: 24 }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card relative bg-[#111111] rounded-2xl p-10 text-left ${
                plan.highlighted
                  ? 'border-2 border-[#D4AF37]'
                  : 'border border-[rgba(255,255,255,0.06)]'
              }`}
            >
              {plan.note && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-inter text-[11px] font-semibold uppercase bg-[#D4AF37] text-[#0a0a0a] px-3 py-1 rounded">
                  {plan.note}
                </span>
              )}
              <h3 className="font-space font-semibold text-[18px] text-[#f1f1f1] mb-4">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-space font-bold text-[48px] text-[#f1f1f1]">{plan.price}</span>
                <span className="font-inter text-[16px] text-[#888888]">{plan.period}</span>
              </div>
              <ul className="space-y-0 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 py-2.5 border-b border-[rgba(255,255,255,0.04)]">
                    <Check size={16} stroke="#D4AF37" strokeWidth={2} />
                    <span className="font-inter text-[15px] text-[#cccccc]">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/auth/signup"
                className={`block w-full font-inter text-[14px] font-semibold py-3 rounded-full text-center transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C158]'
                    : 'border border-[rgba(255,255,255,0.15)] text-[#f1f1f1] bg-transparent hover:bg-[rgba(255,255,255,0.08)]'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
