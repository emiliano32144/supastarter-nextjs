import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@repo/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// GET - Obtener configuración
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;

    const authError = await verifyOwnership(request, organizationId);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const { data, error } = await supabase
      .from("business_config")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching config:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data || null });

  } catch (error: any) {
    console.error("Error in business-config GET:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Guardar configuración
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;

    const authError = await verifyOwnership(request, organizationId);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();

    // Verificar si el slug ya existe (para otra organización)
    if (body.slug) {
      const { data: existingSlug } = await supabase
        .from("business_config")
        .select("organization_id")
        .eq("slug", body.slug)
        .neq("organization_id", organizationId)
        .maybeSingle();

      if (existingSlug) {
        return NextResponse.json(
          { error: "Esta URL ya está en uso por otro negocio" },
          { status: 409 }
        );
      }
    }

    // Config existente (0 o 1 fila). No usar .single() sin fila → rompe el primer guardado.
    const { data: existingConfig } = await supabase
      .from("business_config")
      .select("plan, trial_ends_at")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const paidPlans = ["normal", "pro"] as const;
    const existingPlan = existingConfig?.plan ?? null;
    const isPaid = paidPlans.includes(
      existingPlan as (typeof paidPlans)[number],
    );

    // Nunca dar de alta plan de pago desde este POST (solo Stripe / admin interno).
    let plan: string = isPaid
      ? existingPlan
      : typeof body.plan === "string" &&
          body.plan !== "normal" &&
          body.plan !== "pro"
        ? body.plan
        : (existingPlan ?? "trial");

    let trialEndsAt: string | null = existingConfig?.trial_ends_at ?? null;

    // Trial 14 días: primera vez o fila sin ventana de trial y aún no es plan de pago.
    if (!isPaid && !trialEndsAt) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      plan = "trial";
      trialEndsAt = trialEnd.toISOString();
    }

    // Preparar datos
    const configData = {
      organization_id: organizationId,
      business_name: body.business_name,
      business_description: body.business_description,
      slug: body.slug || null,
      logo_url: body.logo_url || null,
      primary_color: body.primary_color,
      secondary_color: body.secondary_color,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      city: body.city || null,
      opening_time: body.opening_time,
      closing_time: body.closing_time,
      working_days: body.working_days,
      instagram_url: body.instagram_url || null,
      facebook_url: body.facebook_url || null,
      website_url: body.website_url || null,
      timezone: body.timezone || 'Europe/Madrid',
      min_advance_hours: body.min_advance_hours,
      max_advance_days: body.max_advance_days,
      slot_duration: body.slot_duration,
      plan,
      trial_ends_at: trialEndsAt,
      cancellation_fee_enabled: body.cancellation_fee_enabled ?? false,
      cancellation_fee_amount: body.cancellation_fee_amount ?? 0.50,
      cancellation_fee_hours: body.cancellation_fee_hours ?? 24,
      updated_at: new Date().toISOString(),
    };

    // Upsert (insert or update)
    const { data, error } = await supabase
      .from("business_config")
      .upsert(configData, { onConflict: "organization_id" })
      .select()
      .single();

    if (error) {
      console.error("Error saving config:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: data });

  } catch (error: any) {
    console.error("Error in business-config POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



