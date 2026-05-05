import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";
import "cropperjs/dist/cropper.css";
import { config } from "@repo/config";

export const metadata: Metadata = {
	title: {
		absolute: `${config.appName} - Gestor de reservas para barberías`,
		default: `${config.appName} - Gestor de reservas para barberías`,
		template: `%s | ${config.appName}`,
	},
	description:
		"Filo es el gestor de reservas online para barberías. Reservas en 30 segundos, fidelización con puntos XP y gestión completa. Sin comisiones. Desde 19€/mes.",
};

export default function RootLayout({ children }: PropsWithChildren) {
	return children;
}
