"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
          setBooking({ id: bookingId, client_email: email });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [bookingId, email]);

  const handleDateChange = async (date: string) => {
    setNewDate(date);
    setSlotsLoading(true);
    setSelectedTime("");

    try {
      const res = await fetch(
        `/api/public/booking/${bookingId}/reprogramar?email=${encodeURIComponent(email || "")}`,
        { method: "GET" }
      );
      if (!res.ok) throw new Error("No se pudo obtener información");

      const data = await res.json();
      if (data.slug) {
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
      const res = await fetch(`/api/public/booking/${bookingId}/reprogramar`, {
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
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md text-center">
          <p className="text-[#D4AF37] font-medium">⚠️ Se requiere email para reprogramar.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Reserva reprogramada!</h2>
          <p className="text-gray-400 mb-4">
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
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-2">↻ Reprogramar cita</h1>
          <p className="text-gray-400 mb-6">
            Elegí una nueva fecha y horario. Solo podés hacer esto una vez.
          </p>

          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-4 text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Nueva fecha</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          {newDate && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Nuevo horario</label>
              {slotsLoading ? (
                <p className="text-sm text-gray-500">Cargando horarios...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500">No hay horarios disponibles para esa fecha. Probá con otra.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedTime === slot
                          ? "bg-[#D4AF37] text-black"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTime && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-[#D4AF37] text-black rounded-xl font-medium hover:bg-[#b8960b] disabled:opacity-50"
            >
              {submitting ? "Reprogramando..." : "✅ Confirmar nueva fecha y hora"}
            </button>
          )}

          <p className="text-xs text-gray-500 mt-4 text-center">
            Solo se permite 1 reprogramación por reserva.
          </p>
        </div>
      </div>
    </div>
  );
}
