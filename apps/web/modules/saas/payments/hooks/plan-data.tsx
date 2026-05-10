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
		normal: {
			title: "Plan Normal",
			description: "Para barberos y peluqueros independientes.",
			features: [
				"Agenda online ilimitada",
				"Recordatorios automáticos",
				"Fidelización XP (5 niveles)",
				"Cancelación y reprogramación",
				"Hasta 3 profesionales",
				"Soporte por email",
			],
		},
		pro: {
			title: "Plan Pro",
			description: "Para salones con 3+ empleados o múltiples sedes.",
			features: [
				"Todo lo del Plan Normal",
				"Profesionales ilimitados",
				"Múltiples sedes / organizaciones",
				"Personalización avanzada de marca",
				"Soporte prioritario",
			],
		},
	};

	return { planData };
}
