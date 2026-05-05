"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export function FiloHero() {
	const heroRef = useRef<HTMLDivElement>(null);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const [isLoaded, setIsLoaded] = useState(false);
	const params = useParams();
	const locale = (params?.locale as string) || "es";

	const testimonials = [
		{
			initials: "CG",
			name: "Carlos García",
			role: "Barbería Vintage BCN",
			quote: "Desde que uso FILO, mis clientes reservan solos y yo me enfoco en lo que mejor sé hacer: cortar.",
		},
		{
			initials: "MR",
			name: "Miguel Rodríguez",
			role: "The Barber House",
			quote: "El sistema de fidelización ha aumentado mis clientes recurrentes un 40%. Increíble.",
		},
		{
			initials: "AL",
			name: "Antonio López",
			role: "Barbería Clásica",
			quote: "Mis clientes aman poder ver los estilos antes de venir. Ya no hay malentendidos.",
		},
	];

	const [currentTestimonial, setCurrentTestimonial] = useState(0);

	// Parallax effect on mouse move
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!heroRef.current) return;
			const { clientX, clientY } = e;
			const { innerWidth, innerHeight } = window;
			const x = (clientX / innerWidth - 0.5) * 20; // -10 to 10
			const y = (clientY / innerHeight - 0.5) * 20;
			setMousePosition({ x, y });
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);

	// Trigger load animation
	useEffect(() => {
		setIsLoaded(true);
	}, []);

	// Auto-rotate testimonials
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
		}, 5000); // Cambia cada 5 segundos
		return () => clearInterval(interval);
	}, [testimonials.length]);

	const testimonial = testimonials[currentTestimonial];

	return (
		<section
			ref={heroRef}
			className="relative h-screen w-full overflow-hidden bg-black"
		>
			{/* Background Image with Parallax */}
			<div
				className="absolute inset-0 scale-110 transition-transform duration-[2000ms] ease-out"
				style={{
					transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px) scale(1.1)`,
				}}
			>
				<Image
					src="/images/hero-filo.png.png"
					alt="FILO - Sistema de reservas premium"
					fill
					className="object-cover object-center"
					quality={100}
					priority
					onLoad={() => setIsLoaded(true)}
				/>
			</div>

			{/* Cinematic Overlays */}
			<div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.8)_100%)]" />
			<div className="glow-pulse absolute inset-0 bg-[radial-gradient(ellipse_at_80%_40%,rgba(251,191,36,0.12)_0%,transparent_50%)]" />

			{/* Grain Texture */}
			<div className="grain pointer-events-none absolute inset-0" />

			{/* Floating Particles - Fixed values to avoid hydration error */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{[
					{ w: 3, h: 3, l: 10, t: 20, delay: 0, duration: 25 },
					{ w: 2, h: 2, l: 25, t: 60, delay: 3, duration: 30 },
					{ w: 4, h: 4, l: 40, t: 30, delay: 6, duration: 22 },
					{ w: 2, h: 2, l: 55, t: 70, delay: 9, duration: 28 },
					{ w: 3, h: 3, l: 70, t: 15, delay: 12, duration: 24 },
					{ w: 2, h: 2, l: 85, t: 45, delay: 15, duration: 32 },
					{ w: 4, h: 4, l: 15, t: 80, delay: 2, duration: 26 },
					{ w: 3, h: 3, l: 60, t: 10, delay: 8, duration: 29 },
					{ w: 2, h: 2, l: 30, t: 50, delay: 11, duration: 23 },
					{ w: 3, h: 3, l: 90, t: 75, delay: 5, duration: 27 },
				].map((p, i) => (
					<div
						key={i}
						className="particle absolute rounded-full bg-amber-400/30"
						style={{
							width: p.w + "px",
							height: p.h + "px",
							left: p.l + "%",
							top: p.t + "%",
							animationDelay: p.delay + "s",
							animationDuration: p.duration + "s",
						}}
					/>
				))}
			</div>

			{/* Main Content */}
			<div className="relative z-10 flex h-full flex-col justify-center px-8 md:px-16 lg:px-24">
				<div className="max-w-2xl">
					{/* Tagline */}
					<span
						className={`mb-6 inline-block text-[11px] font-medium uppercase tracking-[0.3em] text-amber-400/80 transition-all duration-700 ${
							isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
						}`}
					>
						El sistema de reservas premium
					</span>

					{/* H1 */}
					<h1
						className={`font-serif text-5xl font-light leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl transition-all duration-700 delay-200 ${
							isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
						}`}
						style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
					>
						El filo que<br />
						<span className="italic text-amber-100">corta</span> la<br />
						diferencia.
					</h1>

					{/* Subtitle */}
					<p
						className={`mt-8 max-w-md text-base font-light leading-relaxed text-white/60 md:text-lg transition-all duration-700 delay-400 ${
							isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
						}`}
					>
						Gestiona tu barbería con tecnología que tus clientes amarán. Reservas automáticas,
						fidelización inteligente, cero complicaciones.
					</p>

					{/* CTAs */}
					<div
						className={`mt-10 flex flex-wrap items-center gap-4 transition-all duration-700 delay-500 ${
							isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
						}`}
					>
						<Link
							href={`/${locale}/filo/empezar`}
							className="group relative overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-medium text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
						>
							<span className="relative z-10">Empezar gratis</span>
							<div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-amber-200 to-amber-100 transition-transform duration-300 group-hover:translate-x-0" />
						</Link>
						<Link
							href="/reservas/codetix"
							className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10"
						>
							Ver demo
						</Link>
					</div>

					{/* Micro-copy */}
					<p
						className={`mt-4 text-xs text-white/40 transition-all duration-700 delay-600 ${
							isLoaded ? "opacity-100" : "opacity-0"
						}`}
					>
						Sin tarjeta de crédito · Configuración en 5 minutos
					</p>
				</div>
			</div>

			{/* Testimonial - Right Side */}
			<div
				className={`absolute right-8 top-1/2 z-10 hidden max-w-xs -translate-y-1/2 lg:block transition-all duration-1000 delay-800 ${
					isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
				}`}
			>
				<div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
					<div className="mb-4 flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-black">
							{testimonial.initials}
						</div>
						<div>
							<div className="text-sm font-medium text-white">{testimonial.name}</div>
							<div className="text-[10px] uppercase tracking-wider text-white/50">{testimonial.role}</div>
						</div>
					</div>
					<p className="text-sm font-light leading-relaxed text-white/70">{testimonial.quote}</p>
					<div className="mt-4 flex gap-1.5">
						{testimonials.map((_, i) => (
							<button
								key={i}
								onClick={() => setCurrentTestimonial(i)}
								className={`h-1.5 rounded-full transition-all ${
									i === currentTestimonial ? "bg-white w-4" : "bg-white/30 w-1.5"
								}`}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-between px-8 md:px-16 lg:px-24">
				<span className="text-xs text-white/30">FILO 2025 — Barcelona</span>
				<span className="hidden text-xs text-white/30 md:block">Sistema de reservas para barberías modernas</span>
				<div className="flex items-center gap-2 text-xs text-white/30">
					<span>Scroll to explore</span>
					<svg className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
					</svg>
				</div>
			</div>
		</section>
	);
}
