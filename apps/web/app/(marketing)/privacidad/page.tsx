"use client";

import Link from "next/link";

export default function PrivacidadPage() {
	return (
		<div className="min-h-screen bg-[#0a0a0a] text-white">
			<div className="max-w-3xl mx-auto px-6 py-16">
				<h1 className="text-3xl font-bold mb-8 text-[#D4AF37]">
					Política de Privacidad
				</h1>
				<p className="text-white/50 text-sm mb-8">
					Última actualización: 10 de mayo de 2026
				</p>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">1. Responsable del tratamiento</h2>
					<p className="text-white/70 leading-relaxed">
						El responsable del tratamiento de sus datos personales es <strong>Codetix</strong>,
						con domicilio en España y correo electrónico de contacto: reservas@codetix.es.
						Para cualquier consulta sobre protección de datos, puede contactarnos en la misma dirección.
					</p>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">2. Datos que recopilamos</h2>
					<p className="text-white/70 leading-relaxed">
						Recopilamos los siguientes datos personales:
					</p>
					<ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
						<li><strong>Datos de cuenta:</strong> nombre, dirección de email, contraseña (hash), nombre del negocio</li>
						<li><strong>Datos de reservas:</strong> nombre del cliente, teléfono, email, fecha y hora de la cita, servicio solicitado</li>
						<li><strong>Datos de pago:</strong> gestionados exclusivamente por Stripe. Nosotros no almacenamos números de tarjeta</li>
						<li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, páginas visitadas (a través de Plausible Analytics, sin cookies)</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">3. Finalidad del tratamiento</h2>
					<p className="text-white/70 leading-relaxed">
						Utilizamos sus datos para las siguientes finalidades:
					</p>
					<ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
						<li>Gestionar su cuenta y proporcionar acceso al servicio FILO</li>
						<li>Procesar reservas y enviar confirmaciones por email</li>
						<li>Enviar recordatorios de citas a sus clientes</li>
						<li>Gestionar pagos de suscripción mediante Stripe</li>
						<li>Mejorar nuestro servicio mediante análisis anónimos de uso</li>
						<li>Cumplir obligaciones legales y resolver incidencias</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">4. Base legal</h2>
					<p className="text-white/70 leading-relaxed">
						La base legal para el tratamiento de sus datos es:
					</p>
					<ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
						<li><strong>Ejecución del contrato:</strong> gestión de su cuenta y prestación del servicio (Art. 6.1.b GDPR)</li>
						<li><strong>Consentimiento:</strong> para el envío de comunicaciones comerciales (Art. 6.1.a GDPR)</li>
						<li><strong>Interés legítimo:</strong> para análisis de uso y prevención de fraude (Art. 6.1.f GDPR)</li>
						<li><strong>Obligación legal:</strong> para cumplir requerimientos fiscales y administrativos</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">5. Conservación de datos</h2>
					<p className="text-white/70 leading-relaxed">
						Conservamos sus datos personales durante el tiempo necesario para cumplir con la finalidad para la que fueron recopilados:
					</p>
					<ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
						<li>Datos de cuenta: mientras mantenga la suscripción activa. Tras la cancelación, durante 30 días para exportación</li>
						<li>Datos de reservas: durante la vigencia de la cuenta y 1 año adicional por obligaciones legales</li>
						<li>Datos de facturación: 6 años (obligación legal española)</li>
						<li>Datos de comunicaciones: 2 años</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">6. Derechos del usuario (GDPR)</h2>
					<p className="text-white/70 leading-relaxed">
						De conformidad con el Reglamento General de Protección de Datos (GDPR), usted tiene derecho a:
					</p>
					<ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
						<li><strong>Acceso:</strong> solicitar una copia de sus datos personales</li>
						<li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
						<li><strong>Supresión ("derecho al olvido"):</strong> solicitar la eliminación de sus datos</li>
						<li><strong>Oposición:</strong> oponerse al tratamiento de sus datos en ciertas circunstancias</li>
						<li><strong>Limitación:</strong> solicitar la restricción del tratamiento</li>
						<li><strong>Portabilidad:</strong> recibir sus datos en formato electrónico para transferirlos a otro servicio</li>
					</ul>
					<p className="text-white/70 leading-relaxed mt-3">
						Para ejercer estos derechos, envíe una solicitud a reservas@codetix.es. Le responderemos en un plazo máximo de 30 días.
					</p>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">7. Seguridad de los datos</h2>
					<p className="text-white/70 leading-relaxed">
						Implementamos medidas técnicas y organizativas para proteger sus datos:
					</p>
					<ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
						<li>Cifrado SSL/TLS en todas las comunicaciones</li>
						<li>Cifrado de contraseñas mediante bcrypt</li>
						<li>Acceso restringido a datos mediante autenticación multifactor</li>
						<li>Copias de seguridad diarias en infraestructura cloud segura (Supabase)</li>
						<li>Acceso a datos solo por personal autorizado bajo confidencialidad</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">8. Terceros y encargados de tratamiento</h2>
					<p className="text-white/70 leading-relaxed">
						Para la prestación del servicio, compartimos datos con los siguientes encargados de tratamiento, todos ellos bajo acuerdos de confidencialidad y ubicados en la UE o con garantías adecuadas:
					</p>
					<ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
						<li><strong>Stripe:</strong> procesamiento de pagos (datos de pago)</li>
						<li><strong>Resend:</strong> envío de emails transaccionales</li>
						<li><strong>Supabase:</strong> almacenamiento de base de datos</li>
						<li><strong>Plausible Analytics:</strong> análisis de uso anónimo (sin cookies, sin IP)</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">9. Cookies y tecnologías similares</h2>
					<p className="text-white/70 leading-relaxed">
						FILO utiliza únicamente cookies técnicas esenciales para el funcionamiento del servicio (sesión de usuario, preferencias de idioma). No utilizamos cookies de seguimiento ni publicitarias.
						Para analytics utilizamos Plausible, que no emplea cookies y no almacena direcciones IP.
					</p>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">10. Cambios en la política</h2>
					<p className="text-white/70 leading-relaxed">
						Podemos actualizar esta política de privacidad para reflejar cambios en el servicio o en la legislación aplicable. Le notificaremos mediante email o un aviso prominente en la aplicación con al menos 30 días de antelación.
					</p>
				</section>

				<section className="mb-8">
					<h2 className="text-xl font-semibold mb-4">11. Contacto</h2>
					<p className="text-white/70 leading-relaxed">
						Responsable de protección de datos: reservas@codetix.es<br />
						Dirección: España<br />
						Para reclamaciones ante la autoridad de control: Agencia Española de Protección de Datos (AEPD)
					</p>
				</section>

				<div className="mt-12 pt-8 border-t border-white/10 text-center">
					<Link href="/" className="text-[#D4AF37] hover:underline">
						← Volver al inicio
					</Link>
				</div>
			</div>
		</div>
	);
}
