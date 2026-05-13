"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  expired:
    "El link de confirmación expiró (30 min). El horario fue liberado. Por favor hacé una nueva reserva.",
  invalid_token:
    "Link inválido. Verificá que copiaste el link completo del email.",
  not_found: "Reserva no encontrada.",
  invalid_status: "Esta reserva ya fue cancelada.",
  missing_token: "Link incompleto.",
};

function ConfirmarContent() {
  const params = useSearchParams();
  const success = params.get("success");
  const error = params.get("error");

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 64 }}>✅</div>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: "bold" }}>
          ¡Reserva Confirmada!
        </h1>
        <p style={{ color: "#9CA3AF" }}>
          Te esperamos en tu cita. Revisá tu email.
        </p>
        <a
          href="/"
          style={{
            marginTop: 16,
            background: "#F59E0B",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 64 }}>❌</div>
      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
        No pudimos confirmar
      </h1>
      <p
        style={{
          color: "#9CA3AF",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        {ERROR_MESSAGES[error || ""] || "Algo salió mal. Intentá de nuevo."}
      </p>
      <a
        href="/"
        style={{
          marginTop: 16,
          background: "#374151",
          color: "#fff",
          padding: "12px 28px",
          borderRadius: 8,
          textDecoration: "none",
        }}
      >
        Volver al inicio
      </a>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense>
      <ConfirmarContent />
    </Suspense>
  );
}
