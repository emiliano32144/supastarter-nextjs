"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, Award, Scissors } from "lucide-react";
import { FiloNavbar } from "./components/FiloNavbar";
import { FiloHero } from "./components/FiloHero";

export default function FiloLandingPage() {
	const [openFaq, setOpenFaq] = useState<number | null>(null);
	const params = useParams();
	const locale = (params?.locale as string) || "es";

	return (
		<>
			<FiloNavbar />
			<div className="min-h-screen bg-[#070707] text-white">
				{/* Hero Section */}
				<FiloHero />

				{/* Funcionalidades */}
				<section id="funcionalidades" className="py-24 md:py-32 px-4 bg-[#0a0a0a]">
					<div className="max-w-7xl mx-auto">
						<h2 className="text-3xl md:text-4xl font-light tracking-tight text-white text-center mb-4">
							Todo lo que necesitas en un solo lugar
						</h2>
						<p className="text-white/50 text-center mb-16 max-w-2xl mx-auto">
							Herramientas diseñadas para barberías modernas
						</p>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{/* Card 1 - Reservas */}
							<div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 hover:border-amber-500/30 transition-all duration-500">
								<div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
								<Calendar className="h-12 w-12 text-amber-400 mb-6" />
								<h3 className="text-xl font-medium text-white mb-3">Reservas Online 24/7</h3>
								<p className="text-white/50 text-sm leading-relaxed">
									Tus clientes reservan cuando quieran, desde cualquier dispositivo. Sin llamadas, sin esperas.
								</p>
							</div>

							{/* Card 2 - Fidelización */}
							<div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 hover:border-amber-500/30 transition-all duration-500">
								<div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
								<Award className="h-12 w-12 text-amber-400 mb-6" />
								<h3 className="text-xl font-medium text-white mb-3">Sistema de Fidelización</h3>
								<p className="text-white/50 text-sm leading-relaxed">
									Puntos XP, niveles y recompensas que hacen que tus clientes vuelvan una y otra vez.
								</p>
							</div>

							{/* Card 3 - Galería */}
							<div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 hover:border-amber-500/30 transition-all duration-500">
								<div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
								<Scissors className="h-12 w-12 text-amber-400 mb-6" />
								<h3 className="text-xl font-medium text-white mb-3">Galería de Estilos</h3>
								<p className="text-white/50 text-sm leading-relaxed">
									Muestra tus mejores cortes. Los clientes eligen su estilo antes de llegar.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Cómo funciona */}
				<section id="como-funciona" className="py-24 md:py-32 px-4 bg-[#070707]">
					<div className="max-w-7xl mx-auto">
						<h2 className="text-3xl md:text-4xl font-light tracking-tight text-white text-center mb-4">
							Cómo funciona
						</h2>
						<p className="text-white/50 text-center mb-16 max-w-2xl mx-auto">
							En menos de 10 minutos tendrás tu barbería online
						</p>

						<div className="relative">
							{/* Línea conectora */}
							<div className="hidden lg:block absolute top-12 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

							<div className="grid grid-cols-2 md:grid-cols-5 gap-8">
								{[
									{ num: "1", title: "Regístrate", desc: "Crea tu cuenta en 30 segundos" },
									{ num: "2", title: "Configura", desc: "Añade servicios y horarios" },
									{ num: "3", title: "Personaliza", desc: "Sube tu galería de estilos" },
									{ num: "4", title: "Comparte", desc: "Envía el link a tus clientes" },
									{ num: "5", title: "Gestiona", desc: "Recibe reservas automáticas" },
								].map((step, i) => (
									<div key={i} className="text-center">
										<div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-amber-500/30 bg-amber-500/10 text-amber-400 text-xl font-light mb-4 mx-auto">
											{step.num}
											{/* Punto brillante */}
											<div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
										</div>
										<h3 className="text-white font-medium mb-2">{step.title}</h3>
										<p className="text-white/40 text-sm">{step.desc}</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* Precios */}
				<section id="precios" className="py-24 md:py-32 px-4 bg-[#0a0a0a]">
					<div className="max-w-5xl mx-auto">
						<h2 className="text-4xl md:text-5xl font-light tracking-tight text-center mb-4">
							Planes que se adaptan a ti
						</h2>
						<p className="text-white/50 text-center mb-16 max-w-2xl mx-auto">
							Suscripción fija mensual. Sin comisiones por reserva. Cancela cuando quieras.
						</p>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
							{/* Plan Normal */}
							<div className="bg-white/5 border border-white/10 rounded-2xl p-8">
								<h3 className="text-2xl font-light mb-2">Plan Normal</h3>
								<p className="text-white/50 text-sm mb-4">
									Para barberos y peluqueros independientes o con 1-2 empleados.
								</p>
								<div className="text-5xl font-light text-[#D4AF37] mb-6">
									€49,99<span className="text-lg text-white/60 font-normal">/mes</span>
								</div>
								<ul className="space-y-3 text-white/60 mb-8">
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Agenda online ilimitada</li>
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Recordatorios automáticos</li>
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Fidelización XP (5 niveles)</li>
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Cancelación y reprogramación</li>
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Hasta 3 profesionales</li>
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Soporte por email</li>
								</ul>
								<Link
									href="/pricing"
									className="block w-full text-center px-6 py-4 bg-white/10 border border-white/20 rounded-xl hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300 font-medium"
								>
									Elegir Plan Normal
								</Link>
							</div>

							{/* Plan Pro - Featured */}
							<div className="bg-white/5 border border-[#D4AF37]/50 rounded-2xl p-8 relative">
								<div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4AF37] text-black text-sm font-medium rounded-full">
									MÁS POPULAR
								</div>
								<h3 className="text-2xl font-light mb-2">Plan Pro</h3>
								<p className="text-white/50 text-sm mb-4">
									Para salones con 3+ empleados o múltiples sedes.
								</p>
								<div className="text-5xl font-light text-[#D4AF37] mb-6">
									€95<span className="text-lg text-white/60 font-normal">/mes</span>
								</div>
								<ul className="space-y-3 text-white/60 mb-8">
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Todo lo del Plan Normal</li>
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Profesionales ilimitados</li>
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Múltiples sedes / organizaciones</li>
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Personalización avanzada de marca</li>
									<li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Soporte prioritario</li>
								</ul>
								<Link
									href="/pricing"
									className="block w-full text-center px-6 py-4 bg-[#D4AF37] text-black font-medium rounded-xl hover:bg-[#D4AF37]/90 transition-all duration-300"
								>
									Elegir Plan Pro
								</Link>
							</div>
						</div>

						<div className="mt-12 text-center">
							<p className="text-white/50 text-sm">
								14 días de prueba gratis. Sin tarjeta. Si no te convence, no pagás nada.
							</p>
							<p className="text-white/40 text-xs mt-2">
								¿Necesitás algo más? <a href="mailto:reservas@codetix.es" className="text-[#D4AF37] underline">Escribinos</a>
							</p>
						</div>
					</div>
				</section>

				{/* FAQ */}
				<section id="faq" className="py-24 md:py-32 px-4 bg-[#070707]">
					<div className="max-w-4xl mx-auto">
						<h2 className="text-4xl md:text-5xl font-light tracking-tight text-center mb-16">
							Preguntas frecuentes
						</h2>
						<div className="space-y-4">
							{[
								{
									q: "¿Necesito conocimientos técnicos?",
									a: "No, es muy fácil. FILO está diseñado para ser intuitivo y no requiere conocimientos técnicos.",
								},
								{
									q: "¿Puedo probarlo gratis?",
									a: "Sí, ofrecemos 14 días de prueba gratuita sin compromiso. Oferta permanente.",
								},
								{
									q: "¿Qué pasa con mis datos?",
									a: "Tus datos son tuyos, siempre. FILO respeta tu privacidad y nunca compartimos información con terceros.",
								},
								{
									q: "¿Funciona en móvil?",
									a: "Sí, FILO es 100% responsive y funciona perfectamente en móviles, tablets y ordenadores.",
								},
							].map((faq, index) => (
								<div
									key={index}
									className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
								>
									<button
										onClick={() => setOpenFaq(openFaq === index ? null : index)}
										className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/5 transition-all duration-300"
									>
										<span className="font-medium text-lg">{faq.q}</span>
										<span className="text-2xl text-[#D4AF37]">
											{openFaq === index ? "−" : "+"}
										</span>
									</button>
									{openFaq === index && (
										<div className="px-6 pb-5 text-white/60">
											{faq.a}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</section>

				{/* CTA Final */}
				<section
					className="py-24 md:py-32 px-4"
					style={{
						background: "radial-gradient(circle at center, rgba(212,175,55,0.1) 0%, transparent 70%)",
					}}
				>
					<div className="max-w-4xl mx-auto text-center">
						<h2 className="text-4xl md:text-5xl font-light tracking-tight mb-8 text-white">
							¿Listo para modernizar tu peluquería?
						</h2>
						<Link
							href="/pricing"
							className="inline-block px-12 py-5 bg-[#D4AF37] text-black font-medium text-xl rounded-lg hover:bg-[#D4AF37]/90 transition-all duration-300"
						>
							Ver planes y precios →
						</Link>
					</div>
				</section>

				{/* Footer */}
				<footer className="py-16 px-4 border-t border-white/10">
					<div className="max-w-7xl mx-auto">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
							<div>
								<h3 className="text-2xl font-light text-[#D4AF37] mb-4">FILO</h3>
								<p className="text-white/60">
									El sistema de reservas que tus clientes amarán
								</p>
							</div>
							<div>
								<h4 className="font-medium mb-4">Funcionalidades</h4>
								<ul className="space-y-2 text-white/60">
									<li>Reservas Online</li>
									<li>Fidelización</li>
									<li>Galería de Estilos</li>
								</ul>
							</div>
							<div>
								<h4 className="font-medium mb-4">Empresa</h4>
								<ul className="space-y-2 text-white/60">
									<li>Precios</li>
									<li>Contacto</li>
								</ul>
							</div>
							<div>
								<h4 className="font-medium mb-4">Síguenos</h4>
								<ul className="space-y-2 text-white/60">
									<li>Instagram: @filoapp</li>
									<li>TikTok: @filoapp</li>
									<li>Email: hola@filo.app</li>
								</ul>
							</div>
						</div>
						<div className="text-center text-white/50 pt-8 border-t border-white/10">
							© 2025 FILO. Hecho en Barcelona
						</div>
					</div>
				</footer>
			</div>
		</>
	);
}
