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
    if (isRateLimited(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en un minuto." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, name, phone, organizationId } = body;

    if (!email || !password || !name || !organizationId) {
      return NextResponse.json(
        { error: "Email, contraseña, nombre y organizationId son requeridos" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 409 }
      );
    }

    // Hash de contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Obtener nivel inicial
    const { data: initialLevel } = await supabase
      .from("loyalty_levels")
      .select("name")
      .eq("organization_id", organizationId)
      .eq("level_number", 1)
      .single();

    // Crear perfil
    const { data: profile, error } = await supabase
      .from("client_profiles")
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        password_hash,
        name,
        phone: phone || null,
        total_xp: 0,
        current_level: 1,
        level_name: initialLevel?.name || "Bronce",
      })
      .select("id, email, name, phone, total_xp, current_level, level_name, total_visits, total_spent, last_visit, created_at")
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 });
    }

    // Obtener nivel actual y siguiente para la respuesta
    const { data: levels } = await supabase
      .from("loyalty_levels")
      .select("*")
      .eq("organization_id", organizationId)
      .order("level_number");

    const currentLevelData = levels?.find(l => l.level_number === 1);
    const nextLevelData = levels?.find(l => l.level_number === 2);

    return NextResponse.json({
      success: true,
      client: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        avatar_url: null,
        total_xp: profile.total_xp,
        current_level: profile.current_level,
        level_name: profile.level_name,
        total_visits: profile.total_visits || 0,
        total_spent: profile.total_spent || 0,
        last_visit: profile.last_visit,
      },
      levelInfo: {
        current: currentLevelData,
        next: nextLevelData,
        xpToNextLevel: nextLevelData ? nextLevelData.min_xp - profile.total_xp : 0,
      },
      rewards: [],
      message: "¡Cuenta creada exitosamente!",
    });

  } catch (error: any) {
    console.error("Error in register:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

