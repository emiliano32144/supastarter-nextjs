import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getClientIpForRateLimit,
  isRateLimited,
} from "../../../../lib/rate-limit-memory";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIpForRateLimit(request);
    if (isRateLimited(`misreservas:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Probá en un minuto." },
        { status: 429 }
      );
    }

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

    // Query upcoming bookings SIN joins PostgREST
    let upcomingQuery = supabase
      .from("bookings")
      .select("id, date, start_time, end_time, status, price, notes, created_at, service_id, professional_id, organization_id")
      .eq("client_email", email)
      .in("status", ["pending", "confirmed"])
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (organizationId) {
      upcomingQuery = upcomingQuery.eq("organization_id", organizationId);
    }

    const { data: bookings, error } = await upcomingQuery;

    if (error) {
      console.error("Error fetching client bookings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Query past bookings SIN joins PostgREST
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let pastQuery = supabase
      .from("bookings")
      .select("id, date, start_time, end_time, status, price, notes, created_at, service_id, professional_id, organization_id")
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

    // Enriquecer bookings con datos relacionados en paralelo
    const allBookings = [...(bookings || []), ...(pastBookings || [])];
    const serviceIds = [...new Set(allBookings.map(b => b.service_id).filter(Boolean))];
    const profIds = [...new Set(allBookings.map(b => b.professional_id).filter(Boolean))];
    const orgIds = [...new Set(allBookings.map(b => b.organization_id).filter(Boolean))];

    const [
      { data: services },
      { data: profs },
      { data: configs },
    ] = await Promise.all([
      serviceIds.length > 0 ? supabase.from("services").select("id, name, duration, color").in("id", serviceIds) : { data: [] },
      profIds.length > 0 ? supabase.from("professionals").select("id, name, avatar_url").in("id", profIds) : { data: [] },
      orgIds.length > 0 ? supabase.from("business_config").select("organization_id, business_name, slug, timezone").in("organization_id", orgIds) : { data: [] },
    ]);

    const serviceMap = new Map((services || []).map(s => [s.id, s]));
    const profMap = new Map((profs || []).map(p => [p.id, p]));
    const configMap = new Map((configs || []).map(c => [c.organization_id, c]));

    const enrich = (b: any) => ({
      ...b,
      service: serviceMap.get(b.service_id) || null,
      professional: profMap.get(b.professional_id) || null,
      business: configMap.get(b.organization_id) || null,
    });

    return NextResponse.json({
      success: true,
      upcoming: (bookings || []).map(enrich),
      past: (pastBookings || []).map(enrich),
    });
  } catch (error: any) {
    console.error("Error en mis-reservas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
