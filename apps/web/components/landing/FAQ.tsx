'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: '¿Mis clientes necesitan descargarse una app?',
    a: 'No. Reservan desde cualquier navegador, sin instalar nada. Solo abren el link y listo.',
  },
  {
    q: '¿FILO funciona en móvil?',
    a: 'Sí. FILO es completamente responsive. Tus clientes reservan desde cualquier dispositivo y vos gestionás tu agenda desde tu teléfono.',
  },
  {
    q: '¿Qué pasa cuando termina el período de prueba?',
    a: 'Te avisamos con anticipación. Si decidís no continuar, tu cuenta se pausa y no se te cobra nada.',
  },
  {
    q: '¿Hay contrato o compromiso?',
    a: 'No. Todos los planes son de mes a mes. Cancelás cuando querés, sin penalizaciones ni burocracia.',
  },
  {
    q: '¿Puedo tener varios peluqueros?',
    a: 'Sí. Cada profesional tiene su agenda y los clientes pueden elegir con quién atenderse.',
  },
];

export default function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.faq-left', {
        x: -20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
      gsap.from('.faq-item', {
        y: 10,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
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
      id="faq"
      className="w-full bg-[#0a0a0a]"
      style={{ padding: 'clamp(80px, 10vw, 120px) 0' }}
    >
      <div
        className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[35%_65%]"
        style={{ gap: 60, padding: '0 clamp(24px, 5vw, 80px)' }}
      >
        <div className="faq-left">
          <p className="font-inter text-[12px] font-medium uppercase tracking-[0.12em] text-[#D4AF37] mb-4">
            PREGUNTAS
          </p>
          <h2 className="font-space font-bold text-[clamp(32px,3vw,40px)] text-[#f1f1f1] leading-[1.1]">
            ¿Preguntas?
            <br />
            Tenemos respuestas.
          </h2>
        </div>
        <div>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item border-b border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <span className="font-inter text-[16px] font-medium text-[#f1f1f1] pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-[#888888] flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: openIndex === i ? 200 : 0, opacity: openIndex === i ? 1 : 0 }}
              >
                <p className="font-inter text-[15px] text-[#888888] leading-[1.6] pb-6">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
