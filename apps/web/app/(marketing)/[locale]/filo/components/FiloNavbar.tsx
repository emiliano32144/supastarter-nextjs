"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Menu, X } from "lucide-react";

export function FiloNavbar() {
	const [isOpen, setIsOpen] = useState(false);
	const params = useParams();
	const locale = (params?.locale as string) || "es";

	const navLinks = [
		{ href: "#funcionalidades", label: "Funcionalidades" },
		{ href: "#como-funciona", label: "Cómo funciona" },
		{ href: "#precios", label: "Precios" },
		{ href: "#faq", label: "FAQ" },
	];

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
			<div className="max-w-7xl mx-auto px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link href={`/${locale}/filo`} className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
							<span className="text-black font-bold text-sm">F</span>
						</div>
						<span className="text-white font-semibold text-lg">FILO</span>
					</Link>

					{/* Desktop Nav */}
					<div className="hidden md:flex items-center gap-8">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="text-sm text-white/60 hover:text-white transition-colors"
							>
								{link.label}
							</a>
						))}
					</div>

					{/* CTA */}
					<div className="hidden md:flex items-center gap-4">
						<Link
							href="/auth/login"
							className="text-sm text-white/60 hover:text-white transition-colors"
						>
							Iniciar sesión
						</Link>
						<Link
							href={`/${locale}/filo/empezar`}
							className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
						>
							Empezar gratis
						</Link>
					</div>

					{/* Mobile menu button */}
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="md:hidden text-white"
					>
						{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
					</button>
				</div>

				{/* Mobile Nav */}
				{isOpen && (
					<div className="md:hidden py-4 border-t border-white/10">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="block py-2 text-white/60 hover:text-white transition-colors"
								onClick={() => setIsOpen(false)}
							>
								{link.label}
							</a>
						))}
						<div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
							<Link href="/auth/login" className="text-white/60">
								Iniciar sesión
							</Link>
							<Link
								href={`/${locale}/filo/empezar`}
								className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full text-center"
							>
								Empezar gratis
							</Link>
						</div>
					</div>
				)}
			</div>
		</nav>
	);
}

