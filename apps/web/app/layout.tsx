import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";
import "cropperjs/dist/cropper.css";
import { config } from "@repo/config";
import Script from "next/script";

export const viewport: Viewport = {
	themeColor: "#D4AF37",
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	title: {
		absolute: `${config.appName} - Gestor de reservas para barberías y peluquerías`,
		default: `${config.appName} - Gestor de reservas para barberías y peluquerías`,
		template: `%s | ${config.appName}`,
	},
	description:
		"Filo es el gestor de reservas online para barberías y peluquerías. Reservas en 30 segundos, fidelización con puntos XP, calendario inteligente y gestión completa. Sin comisiones por reserva. Desde 49,99€/mes.",
	keywords: [
		"reservas barbería",
		"gestor citas peluquería",
		"software barbería",
		"agenda online peluquería",
		"fidelización clientes",
		"app reservas salón",
	],
	authors: [{ name: "FILO by Codetix" }],
	creator: "FILO by Codetix",
	publisher: "FILO by Codetix",
	robots: "index, follow",
	manifest: "/manifest.json",
	icons: {
		icon: [
			{ url: "/icons/icon.svg", type: "image/svg+xml", sizes: "any" },
			{ url: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192" },
			{ url: "/icons/icon-512x512.png", type: "image/png", sizes: "512x512" },
		],
		apple: [
			{ url: "/icons/icon-192x192.png", sizes: "192x192" },
		],
	},
	openGraph: {
		title: "FILO - Gestor de reservas para barberías y peluquerías",
		description:
			"Reservas online en 30 segundos. Fidelización con puntos XP. Sin comisiones. Desde 49,99€/mes.",
		type: "website",
		locale: "es_ES",
		siteName: "FILO",
	},
	twitter: {
		card: "summary_large_image",
		title: "FILO - Gestor de reservas para barberías",
		description:
			"Reservas online en 30 segundos. Fidelización con puntos XP. Sin comisiones. Desde 49,99€/mes.",
	},
	alternates: {
		canonical: "https://codetix.es",
	},
	verification: {
		google: "GOOGLE_SITE_VERIFICATION_ID",
	},
};

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<>
			{children}
			<Script
				id="plausible-analytics"
				strategy="afterInteractive"
				data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_URL || "codetix.es"}
				src="https://plausible.io/js/script.js"
			/>
			<Script id="register-sw" strategy="afterInteractive">{
				`
				if ('serviceWorker' in navigator) {
					window.addEventListener('load', function() {
						navigator.serviceWorker.register('/sw.js')
							.then(function(registration) {
								console.log('SW registered:', registration.scope);
							})
							.catch(function(error) {
								console.log('SW registration failed:', error);
							});
					});
				}
				`
			}</Script>
		</>
	);
}
