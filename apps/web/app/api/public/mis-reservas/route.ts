import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const organizationSlug = searchParams.get("slug");

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Buscar organization_id por slug si se proporciona
    let organizationId: string | null = null;
    if (organizationSlug) {
      const { data: config } = await supabase
        .from("business_config")
        .select("organization_id")
        .eq("slug", organizationSlug)
        .maybeSingle();
      if (config) {
        organizationId = config.organization_id;
      }
    }

    // Construir query
    let query = supabase
      .from("bookings")
      .select(`
        id,
        date,
        start_time,
        end_time,
        status,
        price,
        notes,
        created_at,
        service:services(id, name, duration, color),
        professional:professionals(id, name, avatar_url),
        business:business_config(organization_id, business_name, slug, timezone)
      `)
      .eq("client_email", email)
      .in("status", ["pending", "confirmed"])
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error("Error fetching client bookings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // También buscar reservas pasadas recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let pastQuery = supabase
      .from("bookings")
      .select(`
        id,
        date,
        start_time,
        end_time,
        status,
        price,
        notes,
        created_at,
        service:services(id, name, duration, color),
        professional:professionals(id, name, avatar_url),
        business:business_config(organization_id, business_name, slug, timezone)
      `)
      .eq("client_email", email)
      .in("status", ["completed", "cancelled", "no_show"])
      .gte("date", thirtyDaysAgo.toISOString().slice(0, 10))
      .order("date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(10);

    if (organizationId) {
      pastQuery = pastQuery.eq("organization_id", organizationId);
    }

    const { data: pastBookings } = await pastQuery;

    return NextResponse.json({
      success: true,
      upcoming: bookings || [],
      past: pastBookings || [],
    });
  } catch (error: any) {
    console.error("Error en mis-reservas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
