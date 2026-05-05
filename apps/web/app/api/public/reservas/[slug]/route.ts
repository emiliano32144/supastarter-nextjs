import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Buscar configuración del negocio - primero por slug, luego por organization_id
    let businessConfig = null;
    let organizationId = slug;
    
    // Intentar buscar por slug
    const { data: configBySlug } = await supabase
      .from("business_config")
      .select("*")
      .eq("slug", slug)
      .single();
    
    if (configBySlug) {
      businessConfig = configBySlug;
      organizationId = configBySlug.organization_id;
    } else {
      // Si no encuentra por slug, buscar por organization_id
      const { data: configById } = await supabase
        .from("business_config")
        .select("*")
        .eq("organization_id", slug)
        .single();
      
      if (configById) {
        businessConfig = configById;
        organizationId = configById.organization_id;
      }
    }
    
    if (!businessConfig) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Obtener servicios activos
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, name, description, duration, price, color")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("name");

    if (servicesError) {
      console.error("Error fetching services:", servicesError);
      return NextResponse.json({ error: "Error loading services" }, { status: 500 });
    }

    // Obtener profesionales activos
    const { data: professionals, error: professionalsError } = await supabase
      .from("professionals")
      .select("id, name, specialties, avatar_url")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("name");

    if (professionalsError) {
      console.error("Error fetching professionals:", professionalsError);
      return NextResponse.json({ error: "Error loading professionals" }, { status: 500 });
    }

    // Obtener horario laboral (general + por profesional)
    const { data: workingHours, error: workingHoursError } = await supabase
      .from("working_hours")
      .select("id, organization_id, professional_id, day_of_week, is_working, open_time, close_time, break_start, break_end")
      .eq("organization_id", organizationId)
      .order("day_of_week", { ascending: true });

    if (workingHoursError) {
      console.error("Error fetching working_hours:", workingHoursError);
      return NextResponse.json({ error: "Error loading working hours" }, { status: 500 });
    }

    const today = new Date();
    const fromDate = today.toISOString().slice(0, 10);
    const toDateObj = new Date(today);
    toDateObj.setDate(toDateObj.getDate() + 30);
    const toDate = toDateObj.toISOString().slice(0, 10);

    // Obtener reservas futuras para calcular disponibilidad en frontend
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, date, start_time, end_time, status, professional_id")
      .eq("organization_id", organizationId)
      .in("status", ["pending", "confirmed"])
      .gte("date", fromDate)
      .lte("date", toDate);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json({ error: "Error loading bookings" }, { status: 500 });
    }

    // Construir businessInfo desde la configuración
    const businessInfo = {
      name: businessConfig?.business_name || "Mi Salón",
      description: businessConfig?.business_description || "Sistema de reservas online",
      logo: businessConfig?.logo_url || null,
      primaryColor: businessConfig?.primary_color || "#3B82F6",
      secondaryColor: businessConfig?.secondary_color || "#1E40AF",
      phone: businessConfig?.phone || null,
      email: businessConfig?.email || null,
      address: businessConfig?.address || null,
      city: businessConfig?.city || null,
      openingTime: businessConfig?.opening_time || "09:00",
      closingTime: businessConfig?.closing_time || "19:00",
      workingDays: businessConfig?.working_days || ["1","2","3","4","5","6"],
      instagram: businessConfig?.instagram_url || null,
      facebook: businessConfig?.facebook_url || null,
      website: businessConfig?.website_url || null,
      slotDuration: businessConfig?.slot_duration || 30,
    };

    return NextResponse.json({
      success: true,
      business: businessInfo,
      services: services || [],
      professionals: professionals || [],
      workingHours: workingHours || [],
      bookings: bookings || [],
      organizationId: organizationId,
    });

  } catch (error: any) {
    console.error("Error in public API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

