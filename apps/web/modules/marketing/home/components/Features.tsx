"use client";

import { cn } from "@ui/lib";
import {
	CalendarCheckIcon,
	ImageIcon,
	ScissorsIcon,
	StarIcon,
} from "lucide-react";
import { type JSXElementConstructor, type ReactNode, useState } from "react";

export const featureTabs: Array<{
	id: string;
	title: string;
	icon: JSXElementConstructor<any>;
	subtitle?: string;
	description?: ReactNode;
	highlights?: {
		title: string;
		description: string;
		icon: JSXElementConstructor<any>;
	}[];
}> = [
	{
		id: "reservas",
		title: "Reservas en 30 segundos",
		icon: CalendarCheckIcon,
		subtitle: "Tus clientes reservan desde el móvil sin llamadas.",
		description:
			"Calendario inteligente con gestión de citas en tiempo real. Notificaciones automáticas y recordatorios por WhatsApp para reducir ausencias.",
		highlights: [
			{
				title: "Calendario en tiempo real",
				description:
					"Gestiona todos tus peluqueros en un solo panel. Sin solapamientos, sin confusiones.",
				icon: CalendarCheckIcon,
			},
			{
				title: "Recordatorios automáticos",
				description:
					"Reduce las ausencias con recordatorios automáticos por WhatsApp y email antes de cada cita.",
				icon: CalendarCheckIcon,
			},
			{
				title: "Reserva 24/7",
				description:
					"Tus clientes pueden reservar en cualquier momento, aunque tu barbería esté cerrada.",
				icon: CalendarCheckIcon,
			},
		],
	},
	{
		id: "fidelizacion",
		title: "Sistema de fidelización XP",
		icon: StarIcon,
		subtitle: "Convierte visitas en clientes fieles con puntos XP.",
		description:
			"Cada reserva suma puntos XP. Tus clientes suben de nivel y desbloquean recompensas. La gamificación que hace que siempre vuelvan.",
		highlights: [
			{
				title: "Niveles y recompensas",
				description:
					"Bronce, Plata, Oro y Platino. Define descuentos y servicios exclusivos para cada nivel.",
				icon: StarIcon,
			},
			{
				title: "Historial de visitas",
				description:
					"Cada cliente tiene su perfil con historial completo, preferencias y puntos acumulados.",
				icon: StarIcon,
			},
			{
				title: "Notificaciones de logros",
				description:
					"Tus clientes reciben notificaciones cuando suben de nivel o desbloquean una recompensa.",
				icon: StarIcon,
			},
		],
	},
	{
		id: "galeria",
		title: "Galería de estilos",
		icon: ImageIcon,
		subtitle: "Muestra tu trabajo y atrae nuevos clientes.",
		description:
			"Sube fotos de tus mejores cortes y estilos. Los clientes pueden elegir su corte favorito directamente al reservar.",
		highlights: [
			{
				title: "Portfolio visual",
				description:
					"Organiza tus trabajos por categorías: degradados, barbas, cortes clásicos, modernos...",
				icon: ImageIcon,
			},
			{
				title: "Reserva desde la galería",
				description:
					"El cliente ve un estilo que le gusta y reserva directamente. Menos dudas, más conversiones.",
				icon: ImageIcon,
			},
			{
				title: "SEO local incluido",
				description:
					"Tu galería aparece en Google para búsquedas locales de barberías en tu zona.",
				icon: ImageIcon,
			},
		],
	},
	{
		id: "personalizacion",
		title: "Personalización completa",
		icon: ScissorsIcon,
		subtitle: "Tu barbería, tu marca, tus reglas.",
		description:
			"Configura horarios, servicios, precios y peluqueros a tu medida. Página de reservas con tu logo y colores corporativos.",
		highlights: [
			{
				title: "Múltiples servicios",
				description:
					"Corte, barba, tinte, tratamientos... Define todos tus servicios con duración y precio.",
				icon: ScissorsIcon,
			},
			{
				title: "Gestión de peluqueros",
				description:
					"Cada peluquero tiene su agenda, sus servicios y sus propios horarios.",
				icon: ScissorsIcon,
			},
			{
				title: "Tu página de reservas",
				description:
					"Una URL personalizada para tu barbería. Compártela en Instagram, WhatsApp o tu web.",
				icon: ScissorsIcon,
			},
		],
	},
];

export function Features() {
	const [selectedTab, setSelectedTab] = useState(featureTabs[0].id);
	return (
		<section id="features" className="scroll-my-20 pt-12 lg:pt-16">
			<div className="container max-w-5xl">
				<div className="mx-auto mb-6 lg:mb-0 lg:max-w-5xl lg:text-center">
					<h2 className="font-bold text-4xl lg:text-5xl">
						Todo lo que tu barbería necesita
					</h2>
					<p className="mt-6 text-balance text-lg opacity-50">
						Filo reúne en una sola app todo lo que necesitas para
						gestionar tu barbería y hacer crecer tu negocio.
					</p>
				</div>

				<div className="mt-8 mb-4 hidden justify-center lg:flex">
					{featureTabs.map((tab) => {
						return (
							<button
								type="button"
								key={tab.id}
								onClick={() => setSelectedTab(tab.id)}
								className={cn(
									"flex w-32 flex-col items-center gap-2 rounded-lg px-4 py-2",
									selectedTab === tab.id
										? "bg-primary/5 font-bold text-primary dark:bg-primary/10"
										: "font-medium text-foreground/80",
								)}
							>
								<tab.icon
									className={cn(
										"size-6 md:size-8",
										selectedTab === tab.id
											? "text-primary"
											: "text-foreground opacity-30",
									)}
								/>
								<span className="text-center text-xs md:text-sm">
									{tab.title}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			<div>
				<div className="container max-w-5xl">
					{featureTabs.map((tab) => {
						const filteredHighlights = tab.highlights || [];
						return (
							<div
								key={tab.id}
								className={cn(
									"border-t py-8 first:border-t-0 md:py-12 lg:border lg:first:border-t lg:rounded-3xl lg:p-6",
									selectedTab === tab.id
										? "block"
										: "block lg:hidden",
								)}
							>
								<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
									<div>
										<h3 className="font-normal text-2xl text-foreground/60 leading-normal md:text-3xl">
											<strong className="text-secondary">
												{tab.title}.{" "}
											</strong>
											{tab.subtitle}
										</h3>

										{tab.description && (
											<p className="mt-4 text-foreground/60">
												{tab.description}
											</p>
										)}
									</div>
									<div className="flex items-center justify-center">
										<tab.icon className="size-32 text-primary opacity-10" />
									</div>
								</div>

								{filteredHighlights.length > 0 && (
									<div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
										{filteredHighlights.map(
											(highlight, k) => (
												<div
													key={`highlight-${k}`}
													className="flex flex-col items-stretch justify-between rounded-xl bg-card border p-4"
												>
													<div>
														<highlight.icon
															className="text-primary text-xl"
															width="1em"
															height="1em"
														/>
														<strong className="mt-2 block">
															{highlight.title}
														</strong>
														<p className="mt-1 text-sm opacity-50">
															{highlight.description}
														</p>
													</div>
												</div>
											),
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
