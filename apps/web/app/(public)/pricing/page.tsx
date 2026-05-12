"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Plan Normal",
    price: "49,99",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_NORMAL || "",
    description: "Para barberos y peluqueros independientes o con 1-2 empleados.",
    features: [
      "Agenda online ilimitada",
      "Recordatorios automáticos",
      "Fidelización XP (5 niveles)",
      "Cancelación y reprogramación",
      "Hasta 3 profesionales",
      "Soporte por email",
    ],
  },
  {
    name: "Plan Pro",
    price: "95",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "",
    description: "Para salones con 3+ empleados o múltiples sedes.",
    popular: true,
    features: [
      "Todo lo del Plan Normal",
      "Profesionales ilimitados",
      "Múltiples sedes / organizaciones",
      "Personalización avanzada de marca",
      "Soporte prioritario",
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) {
      alert("Price ID no configurado. Contactá a soporte.");
      return;
    }

    setLoading(priceId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al crear la sesión de pago");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white py-20 px-4">
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-[#D4AF37]">filo</span> — Tu agenda, tu negocio
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Suscripción fija mensual. Sin comisiones por reserva. Sin letra chica.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative bg-[#1a1a1a] border-2 ${
              plan.popular ? "border-[#D4AF37]" : "border-gray-700"
            } rounded-2xl overflow-hidden`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-xs font-bold px-4 py-1 rounded-bl-lg">
                MÁS POPULAR
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-white">
                {plan.name}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-[#D4AF37]">
                  €{plan.price}
                </span>
                <span className="text-gray-500">/mes</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={loading === plan.priceId || !plan.priceId}
                className={`w-full py-6 text-lg font-semibold rounded-xl ${
                  plan.popular
                    ? "bg-[#D4AF37] hover:bg-[#b8960b] text-black"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
              >
                {loading === plan.priceId
                  ? "Cargando..."
                  : !plan.priceId
                  ? "No disponible"
                  : "Empezar prueba gratis →"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="max-w-2xl mx-auto text-center mt-16">
        <p className="text-gray-500 text-sm">
          14 días de prueba gratis. Sin tarjeta. Si no te convence, no pagás nada.
        </p>
        <p className="text-gray-600 text-xs mt-2">
          ¿Necesitás algo más?{" "}
          <a href="mailto:reservas@codetix.es" className="text-[#D4AF37] underline">
            Escribinos
          </a>
        </p>
      </div>
    </div>
  );
}
