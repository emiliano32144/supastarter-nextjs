'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote: 'Antes perdía turnos por no atender el teléfono. Ahora mis clientes reservan solos y yo me entero por email. Un cambio total.',
    author: 'Martín R.',
    role: 'Barbería El Maestro, Buenos Aires',
    avatar: '/images/testimonial-avatar-1.jpg',
  },
  {
    quote: 'Lo configuré en 10 minutos. La página quedó genial y mis clientes la usan todo el tiempo. Vale cada peso.',
    author: 'Carlos D.',
    role: 'BarberShop 1900, Madrid',
    avatar: '/images/testimonial-avatar-2.jpg',
  },
  {
    quote: 'Tenía un cuaderno para los turnos. Era un desastre. Ahora tengo todo en el celular y los clientes se organizan solos.',
    author: 'Andre K.',
    role: 'Studio 42, Barcelona',
    avatar: '/images/testimonial-avatar-3.jpg',
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.testimonial-card', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
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
      id="testimonials"
      className="w-full bg-[#0a0a0a]"
      style={{ padding: 'clamp(80px, 10vw, 120px) 0' }}
    >
      <div className="max-w-[1280px] mx-auto" style={{ padding: '0 clamp(24px, 5vw, 80px)' }}>
        <p className="font-inter text-[12px] font-medium uppercase tracking-[0.12em] text-[#D4AF37] mb-4">
          TESTIMONIOS
        </p>
        <h2 className="font-space font-bold text-[clamp(32px,4vw,48px)] text-[#f1f1f1] leading-[1.1] mb-16">
          Lo que dicen
          <br />
          los que ya lo usan.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 32 }}>
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="testimonial-card bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-9 relative"
            >
              <Quote size={24} className="text-[rgba(212,175,55,0.3)] mb-5" strokeWidth={1.5} />
              <p className="font-inter text-[16px] text-[#cccccc] leading-[1.6] mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <p className="font-inter text-[14px] font-semibold text-[#f1f1f1]">{t.author}</p>
                  <p className="font-inter text-[13px] text-[#888888]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
