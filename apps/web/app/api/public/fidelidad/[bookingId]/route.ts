import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Verificar que el booking existe y el email coincide
    const { data: booking } = await supabase
      .from("bookings")
      .select("organization_id, client_profile_id, client_email")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    if (booking.client_email !== email) {
      return NextResponse.json({ error: "Email no coincide con la reserva" }, { status: 403 });
    }

    // Obtener perfil de fidelización
    const { data: profile } = await supabase
      .from("client_profiles")
      .select("id, name, total_xp, current_level_id, total_visits, last_visit")
      .eq("id", booking.client_profile_id)
      .single();

    // Obtener niveles de fidelización
    const { data: levels } = await supabase
      .from("loyalty_levels")
      .select("id, name, min_xp, max_xp, color")
      .eq("organization_id", booking.organization_id)
      .order("min_xp", { ascending: true });

    // Calcular nivel actual y siguiente
    let currentLevel = null;
    let nextLevel = null;
    let progressPercent = 0;

    if (profile && levels) {
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        if (
          profile.total_xp >= level.min_xp &&
          (!level.max_xp || profile.total_xp < level.max_xp)
        ) {
          currentLevel = level;
          nextLevel = levels[i + 1] || null;
          if (nextLevel) {
            progressPercent = Math.min(
              100,
              Math.round(
                ((profile.total_xp - level.min_xp) / (nextLevel.min_xp - level.min_xp)) * 100
              )
            );
          } else {
            progressPercent = 100;
          }
          break;
        }
      }
    }

    // Obtener recompensas disponibles
    const { data: rewards } = await supabase
      .from("earned_rewards")
      .select("id, name, description, xp_cost, status")
      .eq("client_profile_id", booking.client_profile_id)
      .eq("status", "available");

    // Obtener historial de XP
    const { data: xpHistory } = await supabase
      .from("xp_history")
      .select("created_at, xp_amount, reason")
      .eq("client_profile_id", booking.client_profile_id)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      profile: {
        name: profile?.name || email,
        totalXp: profile?.total_xp || 0,
        totalVisits: profile?.total_visits || 0,
        lastVisit: profile?.last_visit,
      },
      currentLevel,
      nextLevel,
      progressPercent,
      levels: levels || [],
      rewards: rewards || [],
      xpHistory: (xpHistory || []).map((h) => ({
        date: h.created_at,
        xp: h.xp_amount,
        reason: h.reason,
      })),
    });
  } catch (error: any) {
    console.error("Error en fidelidad:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
