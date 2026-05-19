import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Términos de Servicio — FILO",
	description:
		"Condiciones generales de contratación y uso del servicio FILO para barberías y peluquerías.",
};

export default function TerminosPage() {
	return (
		<div className="bg-[#0a0a0a] text-[#f1f1f1]">
			<div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
				<h1 className="text-3xl md:text-4xl font-bold mb-6 text-[#D4AF37]">
					Términos de Servicio
				</h1>
				<p className="text-[#888888] text-sm mb-12">
					Última actualización: mayo 2025
				</p>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						1. Definiciones
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						<strong>FILO</strong> (en adelante, "nosotros", "nuestro" o "el Servicio")
						es el software de gestión de reservas operado bajo el dominio{" "}
						<strong>filo.com.es</strong>.{" "}
						<strong>Usuario</strong> ("usted", "su") es la persona física o jurídica
						que contrata el servicio. <strong>Cliente final</strong> es la persona que
						realiza una reserva a través del sistema del usuario.
					</p>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						2. Objeto del servicio
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						FILO proporciona una plataforma SaaS para la gestión de reservas online,
						calendario de citas, fidelización de clientes mediante puntos XP, y
						herramientas administrativas para peluquerías, barberías y salones de
						belleza. El servicio se presta exclusivamente en modalidad cloud
						(software como servicio).
					</p>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						3. Condiciones de contratación
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						El usuario debe ser mayor de edad y tener capacidad legal para contratar.
						Al crear una cuenta, el usuario declara que la información proporcionada
						es veraz y se compromete a mantenerla actualizada. El acceso al servicio
						requiere una conexión a internet y un dispositivo compatible.
					</p>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						4. Precios y pagos
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						FILO ofrece planes de suscripción mensual B2B. Los precios vigentes se
						publican en la web y se facturan mensualmente por adelantado mediante
						Stripe. El usuario puede cancelar la suscripción en cualquier momento
						desde su panel de configuración. No se reembolsarán los períodos parciales.
						Se ofrece un período de prueba gratuito de 14 días para nuevos usuarios.
					</p>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						5. Uso aceptable
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						El usuario se compromete a utilizar FILO únicamente para fines lícitos
						relacionados con la gestión de su negocio. Está prohibido:
					</p>
					<ul className="list-disc list-inside text-[#f1f1f1]/80 mt-2 space-y-1">
						<li>Utilizar el servicio para actividades ilegales o fraudulentas</li>
						<li>Intentar acceder a datos de otros usuarios sin autorización</li>
						<li>Distribuir malware o realizar ataques informáticos</li>
						<li>Revender el acceso al servicio sin autorización expresa</li>
					</ul>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						6. Propiedad intelectual
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						FILO y todos sus componentes (código, diseño, marcas) son propiedad de sus
						respectivos titulares. El usuario no adquiere ningún derecho de propiedad
						intelectual sobre el software. Los datos introducidos por el usuario
						(reservas, clientes, configuración) permanecen en su propiedad exclusiva.
					</p>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						7. Limitación de responsabilidad
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						FILO se proporciona "tal cual" sin garantías expresas o implícitas. No
						seremos responsables de pérdidas indirectas, lucro cesante o daños
						derivados del uso del servicio, salvo en casos de dolo o negligencia grave.
						La responsabilidad máxima se limita al importe abonado por el usuario en
						los 12 meses anteriores al incidente.
					</p>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						8. Rescisión
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						El usuario puede cancelar su suscripción en cualquier momento. A la
						cancelación, sus datos permanecerán disponibles para exportación durante
						30 días, tras los cuales serán eliminados de forma segura. Nos reservamos
						el derecho de suspender o cancelar cuentas que incumplan estos términos,
						previa notificación de 7 días salvo en casos de gravedad.
					</p>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						9. Ley aplicable y jurisdicción
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						Estos términos se rigen por la legislación española. Cualquier disputa
						será sometida a los juzgados y tribunales de Madrid, España.
					</p>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-semibold mb-3 text-[#D4AF37]">
						10. Contacto
					</h2>
					<p className="text-[#f1f1f1]/80 leading-relaxed">
						Para cualquier consulta sobre estos términos: reservas@codetix.es
					</p>
				</section>
			</div>
		</div>
	);
}
