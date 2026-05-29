import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeTime(value: string | null | undefined): string {
  if (value == null) {
    return "";
  }
  const s = String(value);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const professionalId = searchParams.get("professional_id");

    if (!date) {
      return NextResponse.json({ error: "date es requerido" }, { status: 400 });
    }

    let organizationId = slug;

    const { data: configBySlug } = await supabase
      .from("business_config")
      .select("organization_id")
      .eq("slug", slug)
      .maybeSingle();

    if (configBySlug?.organization_id) {
      organizationId = configBySlug.organization_id;
    } else {
      const { data: configById } = await supabase
        .from("business_config")
        .select("organization_id")
        .eq("organization_id", slug)
        .maybeSingle();

      if (configById?.organization_id) {
        organizationId = configById.organization_id;
      }
    }

    const nowIso = new Date().toISOString();
    let query = supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("organization_id", organizationId)
      .eq("date", date)
      // Ocupado = cualquier reserva no cancelada (incluye awaiting_confirmation),
      // alineado con la lógica de disponibilidad de book/reprogramar y con el
      // constraint anti-solapamiento de la BD. Evita mostrar como libre un hueco
      // que está retenido (pendiente de confirmar) y que book rechazaría con 409.
      .neq("status", "cancelled")
      // ...pero un hold expirado (awaiting_confirmation con la ventana de 30 min
      // vencida) no bloquea: book lo cancela en su próxima ejecución, así que el
      // calendario debe mostrarlo libre.
      .or(
        `status.neq.awaiting_confirmation,confirmation_expires_at.gte.${nowIso}`,
      );

    if (professionalId) {
      query = query.eq("professional_id", professionalId);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Error fetching slots bookings:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Bloques parciales del día (start_time/end_time presentes)
    // Los bloqueos de día completo (NULL) se manejan en el calendario, no aquí
    let blockedQuery = supabase
      .from("blocked_slots")
      .select("start_time, end_time")
      .eq("organization_id", organizationId)
      .eq("date", date)
      .not("start_time", "is", null)
      .not("end_time", "is", null);

    if (professionalId) {
      blockedQuery = blockedQuery.or(
        `professional_id.eq.${professionalId},professional_id.is.null`,
      );
    } else {
      blockedQuery = blockedQuery.is("professional_id", null);
    }

    const { data: blockedRows } = await blockedQuery;

    const bookingSlots = (rows || []).map((r) => ({
      start_time: normalizeTime(r.start_time as string),
      end_time: normalizeTime(r.end_time as string),
    }));

    const blockedTimeSlots = (blockedRows || []).map((r) => ({
      start_time: normalizeTime(r.start_time as string),
      end_time: normalizeTime(r.end_time as string),
    }));

    const occupiedSlots = [...bookingSlots, ...blockedTimeSlots];

    return NextResponse.json({ success: true, occupiedSlots });
  } catch (e) {
    console.error("GET /slots:", e);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
