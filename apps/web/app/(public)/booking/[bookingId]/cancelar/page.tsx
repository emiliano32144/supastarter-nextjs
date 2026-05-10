"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function CancelarPage() {
  const params = useParams();
  const bookingId = params?.bookingId as string;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string }>({});

  const handleCancel = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/booking/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_email: email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: "Reserva cancelada exitosamente." });
      } else {
        setResult({ success: false, message: data.error || "No se pudo cancelar la reserva." });
      }
    } catch {
      setResult({ success: false, message: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center">
          <span className="text-[#D4AF37]">Cancelar</span> reserva
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Ingresá tu email para confirmar la cancelación
        </p>

        {result.message ? (
          <div className={`p-4 rounded-xl text-center ${result.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            <p>{result.message}</p>
            {result.success && <a href="/" className="text-[#D4AF37] underline mt-2 inline-block">Volver al inicio →</a>}
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none"
            />
            <button
              onClick={handleCancel}
              disabled={loading || !email}
              className="w-full py-4 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {loading ? "Cancelando..." : "Confirmar cancelación"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
