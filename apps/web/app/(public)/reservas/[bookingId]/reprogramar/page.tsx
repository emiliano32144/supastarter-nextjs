"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ReprogramarPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.bookingId as string;
  const email = searchParams.get("email");

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newDate, setNewDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Obtener datos de la reserva
  useEffect(() => {
    if (!bookingId || !email) {
      setLoading(false);
      return;
    }

    fetch(`/api/public/fidelidad/${bookingId}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          // No tenemos endpoint de "get booking", usamos el de fidelidad que al menos valida
          // Mejor: crear una función simple para obtener la reserva
          setBooking({ id: bookingId, client_email: email });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [bookingId, email]);

  // Obtener slots disponibles cuando cambia la fecha
  useEffect(() => {
    if (!newDate || !bookingId || !email) return;

    setSlotsLoading(true);
    setSelectedTime("");

    // Necesitamos el slug de la organización para consultar slots...
    // En vez de eso, consultamos directamente a un endpoint genérico
    // Pero no tenemos un endpoint que devuelva slots sin slug...
    // Workaround: consultamos la reserva para obtener organization_id y service_id
    fetch(`/api/public/reservas/${bookingId}/info`)
      .then(() => setSlotsLoading(false))
      .catch(() => setSlotsLoading(false));
  }, [newDate, bookingId, email]);

  // 🔧 Simplificación: pedimos la info del negocio a través del bookingId
  const handleDateChange = async (date: string) => {
    setNewDate(date);
    setSlotsLoading(true);
    setSelectedTime("");

    try {
      // Obtener info de la reserva para conseguir organization_id
      const res = await fetch(
        `/api/public/reservas/${bookingId}/reprogramar?email=${encodeURIComponent(email || "")}`,
        { method: "GET" }
      );
      if (!res.ok) throw new Error("No se pudo obtener información");

      const data = await res.json();
      if (data.slug) {
        // Consultar slots del negocio
        const slotsRes = await fetch(
          `/api/public/reservas/${data.slug}/slots?date=${date}&serviceId=${data.service_id}`
        );
        const slotsData = await slotsRes.json();
        if (slotsData.success && slotsData.slots) {
          setSlots(slotsData.slots);
        } else {
          setSlots([]);
        }
      }
    } catch {
      setSlots([]);
    }
    setSlotsLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedTime || !newDate || !email) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/reservas/${bookingId}/reprogramar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_date: newDate,
          new_start_time: selectedTime,
          client_email: email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Error al reprogramar");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">⚠️ Se requiere email para reprogramar.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva reprogramada!</h2>
          <p className="text-gray-600 mb-4">
            Tu cita fue movida al {newDate} a las {selectedTime}. Te enviamos un email de confirmación.
          </p>
          <p className="text-sm text-gray-500">
            Recordá: solo se permite reprogramar una vez. Si necesitás otro cambio, contactá al salón.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">↻ Reprogramar cita</h1>
          <p className="text-gray-600 mb-6">
            Elegí una nueva fecha y horario. Solo podés hacer esto una vez.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-sm">{error}</div>
          )}

          {/* Selector de fecha */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Slots disponibles */}
          {newDate && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nuevo horario
              </label>
              {slotsLoading ? (
                <p className="text-sm text-gray-500">Cargando horarios...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay horarios disponibles para esa fecha. Probá con otra.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedTime === slot
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botón confirmar */}
          {selectedTime && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Reprogramando..." : "✅ Confirmar nueva fecha y hora"}
            </button>
          )}

          <p className="text-xs text-gray-400 mt-4 text-center">
            Solo se permite 1 reprogramación por reserva.
          </p>
        </div>
      </div>
    </div>
  );
}
