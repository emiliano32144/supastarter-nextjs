import type { config } from "@repo/config";
import type { ReactNode } from "react";

type ProductReferenceId = keyof (typeof config)["payments"]["plans"];

export function usePlanData() {
	const planData: Record<
		ProductReferenceId,
		{
			title: string;
			description: ReactNode;
			features: ReactNode[];
		}
	> = {
		free: {
			title: "Gratuito",
			description: "Prueba Filo sin compromiso.",
			features: [
				"Hasta 20 reservas/mes",
				"1 peluquero",
				"Soporte por email",
			],
		},
		basico: {
			title: "Básico",
			description: "Ideal para barberías que empiezan.",
			features: [
				"1 local",
				"Hasta 3 peluqueros",
				"Reservas ilimitadas",
				"Sistema de fidelización XP",
				"Galería de estilos",
				"Soporte por email",
			],
		},
		pro: {
			title: "Pro",
			description: "Para barberías en crecimiento.",
			features: [
				"2 locales",
				"Peluqueros ilimitados",
				"Reservas ilimitadas",
				"Sistema de fidelización XP avanzado",
				"Galería de estilos",
				"Estadísticas y métricas",
				"Soporte prioritario",
				"Personalización de marca",
			],
		},
	};

	return { planData };
}
