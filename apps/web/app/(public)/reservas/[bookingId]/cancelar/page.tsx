"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function CancelBookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.bookingId as string;
  const clientEmail = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleCancel = async () => {
    if (!clientEmail) {
      setResult({ success: false, message: "Email no proporcionado" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/public/reservas/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEmail }),
      });

      const data = await res.json();
      setResult({
        success: res.ok,
        message: data.message || data.error || "Error desconocido",
      });
    } catch {
      setResult({ success: false, message: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">✂️ Cancelar Reserva</h1>
        
        {!result ? (
          <>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que querés cancelar tu reserva? Esta acción no se puede deshacer.
            </p>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Cancelando..." : "✗ Confirmar cancelación"}
            </button>
          </>
        ) : (
          <div className={`p-4 rounded-lg ${result.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            <p className="font-medium">{result.message}</p>
            {result.success && (
              <p className="text-sm mt-2">Se envió una notificación al salón.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
