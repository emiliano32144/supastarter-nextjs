import { cn } from "@ui/lib";

export function FaqSection({ className }: { className?: string }) {
	const items = [
		{
			question: "¿Qué incluye el plan Básico?",
			answer:
				"1 local, hasta 3 peluqueros, reservas ilimitadas, sistema de fidelización XP, galería de estilos y soporte por email.",
		},
		{
			question: "¿Puedo cambiar de plan?",
			answer:
				"Sí, puedes subir o bajar de plan en cualquier momento desde tu panel de control. El cambio se aplica en el siguiente ciclo de facturación.",
		},
		{
			question: "¿Hay permanencia?",
			answer:
				"No, puedes cancelar cuando quieras. Sin compromisos ni letra pequeña.",
		},
		{
			question: "¿Mis clientes tienen que pagar algo?",
			answer:
				"No, el sistema es totalmente gratuito para tus clientes. Solo tú pagas la suscripción mensual.",
		},
	];

	return (
		<section
			className={cn("scroll-mt-20 border-t py-12 lg:py-16", className)}
			id="faq"
		>
			<div className="container max-w-5xl">
				<div className="mb-12 lg:text-center">
					<h1 className="mb-2 font-bold text-4xl lg:text-5xl">
						Preguntas frecuentes
					</h1>
					<p className="text-lg opacity-50">
						Todo lo que necesitas saber antes de empezar.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{items.map((item, i) => (
						<div
							key={`faq-item-${i}`}
							className="rounded-lg bg-card border p-4 lg:p-6"
						>
							<h4 className="mb-2 font-semibold text-lg">
								{item.question}
							</h4>
							<p className="text-foreground/60">{item.answer}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
