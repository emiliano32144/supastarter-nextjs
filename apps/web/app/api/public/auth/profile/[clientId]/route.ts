import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getClientIpForRateLimit,
  isRateLimited,
} from "../../../../../../lib/rate-limit-memory";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    // Este endpoint devuelve PII (email, teléfono, gasto, historial). El
    // rate-limiting mitiga la enumeración/scraping por clientId. NOTA: queda
    // pendiente añadir verificación de identidad (token/sesión o email match)
    // para cerrar del todo el IDOR.
    const ip = getClientIpForRateLimit(request);
    if (isRateLimited(`profile:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Probá en un minuto." },
        { status: 429 }
      );
    }

    const { clientId } = await params;

    // Obtener perfil
    const { data: client, error } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Obtener niveles
    const { data: levels } = await supabase
      .from("loyalty_levels")
      .select("*")
      .eq("organization_id", client.organization_id)
      .order("level_number");

    const currentLevelData = levels?.find(l => l.level_number === client.current_level);
    const nextLevelData = levels?.find(l => l.level_number === client.current_level + 1);

    // Obtener recompensas disponibles
    const { data: rewards } = await supabase
      .from("earned_rewards")
      .select("*")
      .eq("client_profile_id", client.id)
      .eq("status", "available");

    // Obtener historial de XP reciente
    const { data: xpHistory } = await supabase
      .from("xp_history")
      .select("*")
      .eq("client_profile_id", client.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Obtener fotos de cortes
    const { data: photos } = await supabase
      .from("cut_photos")
      .select("*")
      .eq("client_profile_id", client.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      client: {
        id: client.id,
        email: client.email,
        name: client.name,
        phone: client.phone,
        avatar_url: client.avatar_url,
        total_xp: client.total_xp,
        current_level: client.current_level,
        level_name: client.level_name,
        total_visits: client.total_visits,
        total_spent: client.total_spent,
        last_visit: client.last_visit,
      },
      levelInfo: {
        current: currentLevelData,
        next: nextLevelData,
        xpToNextLevel: nextLevelData ? nextLevelData.min_xp - client.total_xp : 0,
        allLevels: levels,
      },
      rewards: rewards || [],
      xpHistory: xpHistory || [],
      photos: photos || [],
    });

  } catch (error: any) {
    console.error("Error in profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



