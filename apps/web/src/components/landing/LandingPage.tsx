'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navigation from './Navigation';
import Hero from './Hero';
import ClientLogos from './ClientLogos';
import FeatureHighlights from './FeatureHighlights';
import FeatureShowcase from './FeatureShowcase';
import Metrics from './Metrics';
import Testimonials from './Testimonials';
import Pricing from './Pricing';
import Integrations from './Integrations';
import FAQ from './FAQ';
import FinalCTA from './FinalCTA';
import Footer from './Footer';

// ParticleCanvas usa WebGL — solo en cliente, sin SSR
const ParticleCanvas = dynamic(() => import('./ParticleCanvas'), { ssr: false });

export default function LandingPage() {
  useEffect(() => {
    let lenis: import('lenis').default | null = null;

    if (window.innerWidth < 768) return;

    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({ lerp: 0.08, duration: 1.2 });

      const raf = (time: number) => {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    });

    return () => {
      lenis?.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      {/* Particle Canvas — fijo detrás de todo */}
      <div className="fixed inset-0 z-0">
        <ParticleCanvas />
      </div>

      {/* Navegación */}
      <Navigation />

      {/* Contenido por encima del canvas */}
      <div className="relative z-[2]">
        <Hero />
        <ClientLogos />
        <FeatureHighlights />
        <FeatureShowcase />
        <Metrics />
        <Testimonials />
        <Pricing />
        <Integrations />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}
