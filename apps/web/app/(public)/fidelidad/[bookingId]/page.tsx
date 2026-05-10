"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function FidelidadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.bookingId as string;
  const email = searchParams.get("email");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId || !email) return;

    fetch(`/api/public/fidelidad/${bookingId}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || "Error al cargar datos");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [bookingId, email]);

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">⚠️ Se requiere email para ver los puntos.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Cargando tus puntos de fidelización...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">❌ {error || "No se pudieron cargar los datos"}</p>
        </div>
      </div>
    );
  }

  const { profile, currentLevel, nextLevel, progressPercent, levels, rewards, xpHistory } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎖️ Tu Programa de Fidelización</h1>
              <p className="text-gray-500 text-sm mt-1">Hola, {profile.name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{profile.totalXp}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Puntos XP</div>
            </div>
          </div>

          {/* Level badge */}
          {currentLevel && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-amber-100">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: currentLevel.color || "#D4AF37" }}
              >
                🏆
              </div>
              <div>
                <p className="font-semibold text-gray-900">Nivel {currentLevel.name}</p>
                {nextLevel && (
                  <p className="text-sm text-gray-600">
                    {nextLevel.min_xp - profile.totalXp} XP más para llegar a {nextLevel.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {nextLevel && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{currentLevel?.name}</span>
                <span>{nextLevel.name}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">{progressPercent}% completado</p>
            </div>
          )}
        </div>

        {/* Rewards */}
        {rewards.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🎁 Recompensas disponibles</h2>
            <div className="space-y-3">
              {rewards.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-sm text-gray-600">{r.description}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                    {r.xp_cost} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* XP History */}
        {xpHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📈 Historial de puntos</h2>
            <div className="space-y-2">
              {xpHistory.map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-sm text-gray-900">{h.reason}</p>
                    <p className="text-xs text-gray-500">{new Date(h.date).toLocaleDateString("es-ES")}</p>
                  </div>
                  <span className="text-blue-600 font-bold">+{h.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All levels */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🏅 Niveles del programa</h2>
          <div className="space-y-2">
            {levels.map((l: any) => {
              const isCurrent = currentLevel?.id === l.id;
              return (
                <div
                  key={l.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isCurrent ? "border-amber-300 bg-yellow-50" : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: l.color || "#ccc" }}
                  >
                    {l.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCurrent ? "text-gray-900" : "text-gray-600"}`}>
                      {l.name} {isCurrent && "(Tú)"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {l.min_xp} - {l.max_xp || "∞"} XP
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Gracias por tu lealtad 💈</p>
          <p className="mt-2">{profile.totalVisits} visitas registradas</p>
        </div>
      </div>
    </div>
  );
}
