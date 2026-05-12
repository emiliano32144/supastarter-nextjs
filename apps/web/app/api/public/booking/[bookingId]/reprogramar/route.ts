import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingConfirmationEmail } from "../../../../../../lib/email/booking-emails";

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

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, organization_id, client_email, client_name, service_id, date, start_time, reschedule_count, status")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    if (booking.client_email !== email) {
      return NextResponse.json({ error: "Email no coincide" }, { status: 403 });
    }

    // Obtener datos relacionados en paralelo
    const [{ data: service }, { data: business }] = await Promise.all([
      booking.service_id ? supabase.from("services").select("id, name, duration").eq("id", booking.service_id).maybeSingle() : { data: null },
      supabase.from("business_config").select("slug, business_name, timezone").eq("organization_id", booking.organization_id).maybeSingle(),
    ]);

    return NextResponse.json({
      success: true,
      slug: business?.slug,
      service_id: booking.service_id,
      service_duration: service?.duration,
      business_name: business?.business_name,
      current_date: booking.date,
      current_time: booking.start_time,
      reschedule_count: booking.reschedule_count || 0,
      status: booking.status,
      timezone: business?.timezone || "Europe/Madrid",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { new_date, new_start_time, client_email } = body;

    // Validar campos requeridos
    if (!new_date || !new_start_time || !client_email) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: new_date, new_start_time, client_email" },
        { status: 400 }
      );
    }

    // Obtener reserva actual sin joins
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, organization_id, client_email, client_name, service_id, professional_id, date, start_time, end_time, price, status, reschedule_count")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // Verificar email
    if (booking.client_email !== client_email) {
      return NextResponse.json({ error: "Email no coincide con la reserva" }, { status: 403 });
    }

    // Verificar límite de reprogramaciones (máximo 1)
    if ((booking.reschedule_count || 0) >= 1) {
      return NextResponse.json(
        { error: "Esta reserva ya fue reprogramada una vez. Contactá al salón para más cambios." },
        { status: 409 }
      );
    }

    // Verificar que no esté cancelada o completada
    if (booking.status === "cancelled" || booking.status === "completed") {
      return NextResponse.json(
        { error: "No se puede reprogramar una reserva cancelada o completada" },
        { status: 409 }
      );
    }

    // Obtener datos relacionados en paralelo
    const [{ data: service }, { data: professional }, { data: business }] = await Promise.all([
      booking.service_id ? supabase.from("services").select("id, name, duration").eq("id", booking.service_id).maybeSingle() : { data: null },
      booking.professional_id ? supabase.from("professionals").select("id, name").eq("id", booking.professional_id).maybeSingle() : { data: null },
      supabase.from("business_config").select("business_name, phone, address, city, timezone").eq("organization_id", booking.organization_id).maybeSingle(),
    ]);

    // Calcular nueva hora de fin
    const [hours, minutes] = new_start_time.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + (service?.duration || 30) * 60000);
    const new_end_time = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

    // Verificar disponibilidad del nuevo slot
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("organization_id", booking.organization_id)
      .eq("date", new_date)
      .eq("professional_id", booking.professional_id)
      .neq("status", "cancelled")
      .neq("id", bookingId)
      .or(`and(start_time.lte.${new_start_time},end_time.gt.${new_start_time}),and(start_time.lt.${new_end_time},end_time.gte.${new_end_time})`);

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: "El nuevo horario ya no está disponible" },
        { status: 409 }
      );
    }

    // Verificar blocked_slots
    let blockedQuery = supabase
      .from("blocked_slots")
      .select("*")
      .eq("organization_id", booking.organization_id)
      .eq("date", new_date);

    if (booking.professional_id) {
      blockedQuery = blockedQuery.or(`professional_id.eq.${booking.professional_id},professional_id.is.null`);
    } else {
      blockedQuery = blockedQuery.is("professional_id", null);
    }

    const { data: blockedSlots } = await blockedQuery;

    for (const slot of blockedSlots || []) {
      if (!slot.start_time && !slot.end_time) {
        return NextResponse.json(
          { error: "El salón no atiende ese día (bloqueado)" },
          { status: 409 }
        );
      }
      if (slot.start_time && slot.end_time) {
        if (
          new_start_time >= slot.start_time &&
          new_start_time < slot.end_time
        ) {
          return NextResponse.json(
            { error: "El salón no atiende en ese horario (bloqueado)" },
            { status: 409 }
          );
        }
      }
    }

    // Actualizar reserva
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        date: new_date,
        start_time: new_start_time,
        end_time: new_end_time,
        reschedule_count: (booking.reschedule_count || 0) + 1,
        reminder_sent: false,
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("Error reprogramando:", updateError);
      return NextResponse.json({ error: "Error al reprogramar" }, { status: 500 });
    }

    // Enviar email de confirmación del cambio
    try {
      await sendBookingConfirmationEmail({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        serviceName: service?.name || "Servicio",
        professionalName: professional?.name || null,
        date: new_date,
        time: new_start_time,
        price: booking.price || 0,
        businessName: business?.business_name || "Negocio",
        businessPhone: business?.phone || undefined,
        businessAddress: business?.address
          ? `${business.address}${business.city ? `, ${business.city}` : ""}`
          : undefined,
        bookingId,
        timezone: business?.timezone || "Europe/Madrid",
      });
    } catch (emailError) {
      console.error("❌ Error enviando email de reprogramación:", emailError);
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Reserva reprogramada exitosamente. Recordatorio: solo se permite 1 reprogramación.",
    });
  } catch (error: any) {
    console.error("Error en reprogramación:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}