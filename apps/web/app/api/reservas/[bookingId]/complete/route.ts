import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    // 1. Obtener la reserva
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // 2. Actualizar estado a completed
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: "Error al actualizar reserva" }, { status: 500 });
    }

    // 3. Si hay client_profile_id, otorgar XP
    let xpAwarded = 0;
    let newLevel = null;
    let levelUp = false;

    if (booking.client_profile_id) {
      // Obtener el servicio para obtener xp_value
      let xpValue = 100; // Valor por defecto
      if (booking.service_id) {
        const { data: service } = await supabase
          .from("services")
          .select("xp_value, name, price")
          .eq("id", booking.service_id)
          .single();

        if (service?.xp_value) {
          xpValue = service.xp_value;
        }
      }

      // Obtener perfil actual
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("id", booking.client_profile_id)
        .single();

      if (profile) {
        const newTotalXp = (profile.total_xp || 0) + xpValue;
        const newTotalVisits = (profile.total_visits || 0) + 1;
        const newTotalSpent = parseFloat(profile.total_spent || "0") + parseFloat(booking.price || "0");

        // Obtener niveles del negocio
        const { data: levels } = await supabase
          .from("loyalty_levels")
          .select("*")
          .eq("organization_id", booking.organization_id)
          .order("min_xp", { ascending: false });

        // Determinar nuevo nivel
        let currentLevel = profile.current_level || 1;
        let levelName = profile.level_name || "Bronce";

        if (levels && levels.length > 0) {
          for (const level of levels) {
            if (newTotalXp >= level.min_xp) {
              if (level.level_number > currentLevel) {
                levelUp = true;
                newLevel = level;

                // Crear recompensa si el nivel tiene una
                if (level.reward_type && level.reward_type !== "none") {
                  await supabase.from("earned_rewards").insert({
                    organization_id: booking.organization_id,
                    client_profile_id: booking.client_profile_id,
                    loyalty_level_id: level.id,
                    reward_type: level.reward_type,
                    reward_value: level.reward_value,
                    reward_description: level.reward_description,
                    status: "available",
                    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 días
                  });
                }
              }
              currentLevel = level.level_number;
              levelName = level.name;
              break;
            }
          }
        }

        // Obtener nombre del servicio para el historial
        let serviceName = "Servicio";
        if (booking.service_id) {
          const { data: service } = await supabase
            .from("services")
            .select("name")
            .eq("id", booking.service_id)
            .single();
          if (service) {
            serviceName = service.name;
          }
        }

        // Verificar si ya se otorgó XP para esta reserva (idempotencia)
        const { data: existingXp } = await supabase
          .from("xp_history")
          .select("id")
          .eq("booking_id", bookingId)
          .maybeSingle();

        if (!existingXp) {
          // Actualizar perfil (solo si es la primera vez que se completa)
          await supabase
            .from("client_profiles")
            .update({
              total_xp: newTotalXp,
              total_visits: newTotalVisits,
              total_spent: newTotalSpent.toString(),
              current_level: currentLevel,
              level_name: levelName,
              last_visit: new Date().toISOString(),
            })
            .eq("id", booking.client_profile_id);

          // Registrar en historial de XP
          await supabase.from("xp_history").insert({
            organization_id: booking.organization_id,
            client_profile_id: booking.client_profile_id,
            xp_amount: xpValue,
            reason: `Servicio completado: ${serviceName}`,
            booking_id: bookingId,
          });

          xpAwarded = xpValue;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Reserva completada",
      xpAwarded,
      levelUp,
      newLevel: newLevel ? { name: newLevel.name, icon: newLevel.icon } : null,
    });

  } catch (error: any) {
    console.error("Error completing booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

