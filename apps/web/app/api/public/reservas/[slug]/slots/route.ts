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

    let query = supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("organization_id", organizationId)
      .eq("date", date)
      .in("status", ["pending", "confirmed"]);

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

    const occupiedSlots = (rows || []).map((r) => ({
      start_time: normalizeTime(r.start_time as string),
      end_time: normalizeTime(r.end_time as string),
    }));

    return NextResponse.json({ success: true, occupiedSlots });
  } catch (e) {
    console.error("GET /slots:", e);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
