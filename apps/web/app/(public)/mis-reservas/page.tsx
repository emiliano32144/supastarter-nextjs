"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MisReservasPage() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchReservas = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/public/mis-reservas?email=${encodeURIComponent(email.trim())}`
      );
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Error al cargar reservas");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Si viene con email en la URL, cargar automáticamente
  useEffect(() => {
    if (initialEmail) {
      fetchReservas();
    }
  }, [initialEmail]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "⏳ Pendiente", color: "text-yellow-400" };
      case "confirmed":
        return { label: "✅ Confirmada", color: "text-green-400" };
      case "completed":
        return { label: "✓ Completada", color: "text-blue-400" };
      case "cancelled":
        return { label: "✗ Cancelada", color: "text-red-400" };
      case "no_show":
        return { label: "⚠ No asistió", color: "text-gray-400" };
      default:
        return { label: status, color: "text-gray-400" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Mis Reservas</h1>
          <p className="text-gray-500">Consultá todas tus citas en un solo lugar</p>
        </div>

        {/* Formulario de email */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <form onSubmit={fetchReservas} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "..." : "Buscar"}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Sin reservas */}
        {data && data.upcoming.length === 0 && data.past.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tenés reservas
            </h3>
            <p className="text-gray-500 text-sm">
              Con este email no hay citas activas ni recientes.
            </p>
          </div>
        )}

        {/* Próximas reservas */}
        {data && data.upcoming.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              🗓️ Próximas citas
              <span className="text-sm font-normal text-gray-500">
                ({data.upcoming.length})
              </span>
            </h2>
            <div className="space-y-4">
              {data.upcoming.map((booking: any) => {
                const status = getStatusLabel(booking.status);
                const isPending = booking.status === "pending";
                return (
                  <div
                    key={booking.id}
                    className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.service?.name || "Servicio"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.date)} • {booking.start_time?.slice(0, 5)}
                        </p>
                      </div>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {booking.professional?.name && (
                      <p className="text-xs text-gray-500 mb-2">
                        💇 Con {booking.professional.name}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <span className="text-sm font-bold text-gray-900">
                        €{booking.price || 0}
                      </span>
                      <div className="flex gap-2">
                        {isPending && (
                          <>
                            <a
                              href={`/reservas/${booking.id}/reprogramar?email=${encodeURIComponent(email)}`}
                              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium"
                            >
                              ↻ Reprogramar
                            </a>
                            <a
                              href={`/reservas/${booking.id}/cancelar?email=${encodeURIComponent(email)}`}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                            >
                              ✗ Cancelar
                            </a>
                          </>
                        )}
                        <a
                          href={`/fidelidad/${booking.id}?email=${encodeURIComponent(email)}`}
                          className="text-xs px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-medium"
                        >
                          🎖️ Puntos
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Historial */}
        {data && data.past.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📜 Historial reciente
              <span className="text-sm font-normal text-gray-500">
                (últimos 30 días)
              </span>
            </h2>
            <div className="space-y-3">
              {data.past.map((booking: any) => {
                const status = getStatusLabel(booking.status);
                return (
                  <div
                    key={booking.id}
                    className="border border-gray-100 rounded-xl p-4 opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.service?.name || "Servicio"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.date)} • {booking.start_time?.slice(0, 5)}
                        </p>
                      </div>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
