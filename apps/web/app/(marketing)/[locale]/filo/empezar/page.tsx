"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Check, AlertTriangle } from "lucide-react";
import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { orpc } from "@shared/lib/orpc-query-utils";

const planes = [
	{
		id: "basico",
		nombre: "Básico",
		precio: "€19",
		periodo: "/mes",
		descripcion: "Para empezar",
		features: [
			"2 profesionales",
			"Recordatorios por Gmail",
			"Perfiles de clientes",
			"Panel de control",
		],
		destacado: false,
	},
	{
		id: "pro",
		nombre: "Pro",
		precio: "€39",
		periodo: "/mes",
		descripcion: "Más popular",
		features: [
			"Profesionales ilimitados",
			"Recordatorios por Gmail",
			"Personalización total",
			"Panel de control avanzado",
			"Sistema de fidelización",
		],
		destacado: true,
	},
	{
		id: "lanzamiento",
		nombre: "Oferta Lanzamiento",
		precio: "€1",
		periodo: "/60 días",
		descripcion: "Tiempo limitado",
		features: [
			"60 días Pro gratis",
			"Luego eliges tu plan",
			"Pro a €19/mes para siempre",
			"Sin compromiso",
		],
		destacado: false,
	},
	{
		id: "lifetime",
		nombre: "Lifetime",
		precio: "€400",
		periodo: "pago único",
		descripcion: "Para siempre",
		features: [
			"Todo incluido",
			"Sin límites",
			"Actualizaciones de por vida",
			"Soporte prioritario",
		],
		destacado: false,
	},
];

// Mapeo de planes del formulario a planes en config y tipos de checkout
const PLAN_CONFIG: Record<
	string,
	{ planId: string; productId: string; type: "subscription" | "one-time" }
> = {
	basico: {
		planId: "basico",
		productId: process.env.NEXT_PUBLIC_PRICE_ID_BASICO_MONTHLY || "",
		type: "subscription",
	},
	pro: {
		planId: "pro",
		productId: process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY || "",
		type: "subscription",
	},
	lifetime: {
		planId: "lifetime",
		productId: process.env.NEXT_PUBLIC_PRICE_ID_LIFETIME || "",
		type: "one-time",
	},
	lanzamiento: {
		planId: "promo",
		productId: process.env.NEXT_PUBLIC_PRICE_ID_PROMO_LANZAMIENTO || "",
		type: "subscription",
	},
};

export default function EmpezarPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const locale = (params?.locale as string) || "es";
	
	// Leer plan desde query param
	const planFromUrl = searchParams.get("plan");
	const validPlans = ["basico", "pro", "lanzamiento", "lifetime"];
	const initialPlan = planFromUrl && validPlans.includes(planFromUrl) 
		? planFromUrl 
		: "lanzamiento";
	
	const [planSeleccionado, setPlanSeleccionado] = useState(initialPlan);
	const [paso, setPaso] = useState(planFromUrl && validPlans.includes(planFromUrl) ? 2 : 1); // 1: elegir plan, 2: registro
	const [formData, setFormData] = useState({
		nombre: "",
		email: "",
		password: "",
		nombreBarberia: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const createCheckoutLinkMutation = useMutation(
		orpc.payments.createCheckoutLink.mutationOptions(),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const { error: signupError } = await authClient.signUp.email({
				email: formData.email,
				password: formData.password,
				name: formData.nombre,
				callbackURL: config.auth.redirectAfterSignIn,
			});

			if (signupError) {
				// Manejo de errores comunes
				let errorMessage = "Error al crear la cuenta. Por favor, intenta de nuevo.";
				
				if (signupError.code === "USER_ALREADY_EXISTS") {
					errorMessage = "Este email ya está registrado. ¿Quieres iniciar sesión?";
				} else if (signupError.code === "INVALID_EMAIL") {
					errorMessage = "El email no es válido.";
				} else if (signupError.code === "PASSWORD_TOO_SHORT") {
					errorMessage = "La contraseña debe tener al menos 8 caracteres.";
				} else if (signupError.message) {
					errorMessage = signupError.message;
				}

				setError(errorMessage);
				setLoading(false);
				return;
			}

			// Usuario creado y autenticado (autoSignIn: true)
			console.log("[FILO Signup] Usuario registrado exitosamente");
			
			// Obtener configuración del plan seleccionado
			const planConfig = PLAN_CONFIG[planSeleccionado];
			console.log("[FILO Checkout] Plan seleccionado:", planSeleccionado);
			console.log("[FILO Checkout] Plan config:", planConfig);

			if (!planConfig || !planConfig.productId) {
				console.error("[FILO Checkout] Plan no válido:", { planSeleccionado, planConfig });
				setError("Plan no válido o no configurado. Por favor, contacta con soporte.");
				setLoading(false);
				return;
			}

			// Crear checkout link con Stripe
			try {
				console.log("[FILO Checkout] Creando checkout link con:", {
					type: planConfig.type,
					productId: planConfig.productId,
					redirectUrl: `${window.location.origin}/app?checkout=success`,
				});

				const { checkoutLink } = await createCheckoutLinkMutation.mutateAsync({
					type: planConfig.type,
					productId: planConfig.productId,
					redirectUrl: `${window.location.origin}/app?checkout=success`,
				});

				console.log("[FILO Checkout] Checkout link creado:", checkoutLink);

				// Redirigir a Stripe Checkout
				window.location.href = checkoutLink;
			} catch (paymentError) {
				console.error("[FILO Checkout] Error completo:", paymentError);
				console.error("[FILO Checkout] Error details:", {
					message: paymentError instanceof Error ? paymentError.message : String(paymentError),
					stack: paymentError instanceof Error ? paymentError.stack : undefined,
					error: paymentError,
				});
				
				// Mostrar error más específico
				let errorMessage = "Error al procesar el pago. Por favor, intenta de nuevo o contacta con soporte.";
				if (paymentError instanceof Error) {
					if (paymentError.message.includes("productId")) {
						errorMessage = "Error: El plan seleccionado no está configurado correctamente.";
					} else if (paymentError.message.includes("STRIPE")) {
						errorMessage = "Error de conexión con Stripe. Verifica la configuración.";
					} else {
						errorMessage = `Error: ${paymentError.message}`;
					}
				}
				
				setError(errorMessage);
				setLoading(false);
			}

		} catch (e) {
			console.error("[FILO Signup] Error:", e);
			setError("Error inesperado. Por favor, intenta de nuevo.");
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#070707] text-white">
			{/* Navbar simple */}
			<nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
				<div className="max-w-7xl mx-auto px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link href={`/${locale}/filo`} className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
								<span className="text-black font-bold text-sm">F</span>
							</div>
							<span className="text-white font-semibold text-lg">FILO</span>
						</Link>
					</div>
				</div>
			</nav>

			<div className="pt-24 pb-16 px-4">
				<div className="max-w-6xl mx-auto">
					{/* Header */}
					<div className="text-center mb-12">
						<h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
							Empieza con <span className="text-amber-400">FILO</span>
						</h1>
						<p className="text-white/60 text-lg max-w-2xl mx-auto">
							{paso === 1
								? "Elige el plan que mejor se adapte a tu barbería"
								: "Crea tu cuenta para continuar"}
						</p>
					</div>

					{/* Paso 1: Elegir Plan */}
					{paso === 1 && (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
								{planes.map((plan) => (
									<div
										key={plan.id}
										onClick={() => setPlanSeleccionado(plan.id)}
										className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
											planSeleccionado === plan.id
												? "bg-amber-500/10 border-2 border-amber-500 scale-[1.02]"
												: "bg-white/5 border border-white/10 hover:border-white/20"
										}`}
									>
										{plan.destacado && (
											<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-medium rounded-full">
												RECOMENDADO
											</div>
										)}

										<h3 className="text-lg font-medium mb-1">{plan.nombre}</h3>
										<p className="text-white/40 text-sm mb-4">{plan.descripcion}</p>

										<div className="mb-4">
											<span className="text-3xl font-light">{plan.precio}</span>
											<span className="text-white/40 text-sm">{plan.periodo}</span>
										</div>

										<ul className="space-y-2">
											{plan.features.map((feature, i) => (
												<li key={i} className="flex items-center gap-2 text-sm text-white/70">
													<Check className="h-4 w-4 text-amber-400 flex-shrink-0" />
													{feature}
												</li>
											))}
										</ul>

										{planSeleccionado === plan.id && (
											<div className="absolute top-4 right-4 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
												<Check className="h-4 w-4 text-black" />
											</div>
										)}
									</div>
								))}
							</div>

							<div className="text-center">
								<button
									onClick={() => setPaso(2)}
									className="px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-all"
								>
									Continuar con {planes.find((p) => p.id === planSeleccionado)?.nombre}
								</button>
								<p className="mt-4 text-white/40 text-sm">
									Sin compromiso · Cancela cuando quieras
								</p>
							</div>
						</>
					)}

					{/* Paso 2: Registro */}
					{paso === 2 && (
						<div className="max-w-md mx-auto">
							<div className="bg-white/5 border border-white/10 rounded-2xl p-8">
								{/* Plan seleccionado */}
								<div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm text-white/60">Plan seleccionado</p>
											<p className="font-medium">
												{planes.find((p) => p.id === planSeleccionado)?.nombre}
											</p>
										</div>
										<button
											onClick={() => setPaso(1)}
											className="text-amber-400 text-sm hover:underline"
										>
											Cambiar
										</button>
									</div>
								</div>

								{/* Mensaje de éxito */}
								{success && (
									<div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
										<p className="text-green-400 font-medium text-lg mb-2">
											¡Cuenta creada!
										</p>
										<p className="text-green-400/80 text-sm mb-4">
											Te enviamos un email de verificación. Haz click en el enlace para activar tu cuenta.
										</p>
										<Link
											href="/auth/login"
											className="inline-block px-6 py-3 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors"
										>
											Ya verifiqué mi email → Iniciar sesión
										</Link>
									</div>
								)}

								{/* Mensaje de error */}
								{error && (
									<div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
										<AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
										<p className="text-red-400 text-sm">{error}</p>
									</div>
								)}

								<form onSubmit={handleSubmit} className="space-y-4">
									<div>
										<label className="block text-sm text-white/60 mb-2">Nombre</label>
										<input
											type="text"
											required
											disabled={success || loading}
											value={formData.nombre}
											onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
											className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-amber-500 focus:outline-none transition-colors disabled:opacity-50"
											placeholder="Tu nombre"
										/>
									</div>

									<div>
										<label className="block text-sm text-white/60 mb-2">Email</label>
										<input
											type="email"
											required
											disabled={success || loading}
											value={formData.email}
											onChange={(e) => setFormData({ ...formData, email: e.target.value })}
											className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-amber-500 focus:outline-none transition-colors disabled:opacity-50"
											placeholder="tu@email.com"
										/>
									</div>

									<div>
										<label className="block text-sm text-white/60 mb-2">Contraseña</label>
										<input
											type="password"
											required
											minLength={8}
											disabled={success || loading}
											value={formData.password}
											onChange={(e) => setFormData({ ...formData, password: e.target.value })}
											className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-amber-500 focus:outline-none transition-colors disabled:opacity-50"
											placeholder="Mínimo 8 caracteres"
										/>
									</div>

									<div>
										<label className="block text-sm text-white/60 mb-2">Nombre de tu barbería</label>
										<input
											type="text"
											required
											disabled={success || loading}
											value={formData.nombreBarberia}
											onChange={(e) => setFormData({ ...formData, nombreBarberia: e.target.value })}
											className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-amber-500 focus:outline-none transition-colors disabled:opacity-50"
											placeholder="Ej: Barbería Vintage"
										/>
									</div>

									<button
										type="submit"
										disabled={loading || success}
										className="w-full py-4 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
									>
										{loading ? "Creando cuenta..." : success ? "Cuenta creada ✓" : "Crear cuenta y continuar"}
									</button>
								</form>

								<div className="mt-6 text-center">
									<p className="text-white/40 text-sm">
										¿Ya tienes cuenta?{" "}
										<Link href="/auth/login" className="text-amber-400 hover:underline">
											Iniciar sesión
										</Link>
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

