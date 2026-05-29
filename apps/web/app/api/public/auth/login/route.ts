import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  getClientIpForRateLimit,
  isRateLimited,
} from "../../../../../lib/rate-limit-memory";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpForRateLimit(request);
    if (isRateLimited(`login:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en un minuto." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, organizationId } = body;

    if (!email || !password || !organizationId) {
      return NextResponse.json(
        { error: "Email, contraseña y organizationId son requeridos" },
        { status: 400 }
      );
    }

    // Buscar cliente
    const { data: client, error } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("email", email.toLowerCase())
      .single();

    if (error || !client) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, client.password_hash || "");
    if (!validPassword) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Obtener nivel actual y siguiente
    const { data: levels } = await supabase
      .from("loyalty_levels")
      .select("*")
      .eq("organization_id", organizationId)
      .order("level_number");

    const currentLevelData = levels?.find(l => l.level_number === client.current_level);
    const nextLevelData = levels?.find(l => l.level_number === client.current_level + 1);

    // Obtener recompensas disponibles
    const { data: rewards } = await supabase
      .from("earned_rewards")
      .select("*")
      .eq("client_profile_id", client.id)
      .eq("status", "available");

    return NextResponse.json({
      success: true,
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
      },
      rewards: rewards || [],
    });

  } catch (error: any) {
    console.error("Error in login:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



