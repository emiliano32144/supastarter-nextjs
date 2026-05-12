import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@repo/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function verifyOwnership(request: NextRequest, organizationId: string) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return { error: "No autorizado", status: 401 };
  }
  const { data: membership } = await supabase
    .from("member")
    .select("id")
    .eq("userId", session.user.id)
    .eq("organizationId", organizationId)
    .maybeSingle();
  if (!membership) {
    return { error: "Acceso denegado", status: 403 };
  }
  return null;
}

// GET /api/reservas/blocked-slots?organization_id=X[&from=YYYY-MM-DD&to=YYYY-MM-DD&professional_id=Y]
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organization_id");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const professionalId = searchParams.get("professional_id");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organization_id es requerido" },
        { status: 400 },
      );
    }

    const authError = await verifyOwnership(request, organizationId);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    let query = supabase
      .from("blocked_slots")
      .select("*")
      .eq("organization_id", organizationId)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    if (professionalId) {
      // Trae los del profesional específico + los globales (professional_id NULL)
      query = query.or(`professional_id.eq.${professionalId},professional_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching blocked_slots:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, blockedSlots: data || [] });
  } catch (err: any) {
    console.error("GET /blocked-slots:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/reservas/blocked-slots
// Body: { organization_id, professional_id?, date, start_time?, end_time?, reason? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, professional_id, date, start_time, end_time, reason } = body;

    if (!organization_id || !date) {
      return NextResponse.json(
        { error: "organization_id y date son requeridos" },
        { status: 400 },
      );
    }

    const authError = await verifyOwnership(request, organization_id);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    // Validar que si viene start_time también venga end_time y viceversa
    if ((start_time && !end_time) || (!start_time && end_time)) {
      return NextResponse.json(
        { error: "start_time y end_time deben venir juntos o ninguno (bloqueo de día completo)" },
        { status: 400 },
      );
    }

    // Validar rango temporal si aplica
    if (start_time && end_time && start_time >= end_time) {
      return NextResponse.json(
        { error: "start_time debe ser anterior a end_time" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("blocked_slots")
      .insert({
        organization_id,
        professional_id: professional_id || null,
        date,
        start_time: start_time || null,
        end_time: end_time || null,
        reason: reason || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting blocked_slot:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, blockedSlot: data }, { status: 201 });
  } catch (err: any) {
    console.error("POST /blocked-slots:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/reservas/blocked-slots?id=UUID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    // Obtener organization_id del slot antes de borrar
    const { data: slot } = await supabase
      .from("blocked_slots")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (!slot) {
      return NextResponse.json({ error: "Slot no encontrado" }, { status: 404 });
    }

    const authError = await verifyOwnership(request, slot.organization_id);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const { error } = await supabase
      .from("blocked_slots")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting blocked_slot:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /blocked-slots:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
