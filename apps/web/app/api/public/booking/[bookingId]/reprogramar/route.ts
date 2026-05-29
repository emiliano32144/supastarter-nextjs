import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sendRescheduleEmail } from "../../../../../../lib/email/booking-emails";
import {
  getClientIpForRateLimit,
  isRateLimited,
} from "../../../../../../lib/rate-limit-memory";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const reprogramarBodySchema = z.object({
	new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	new_start_time: z.string().min(4).max(12),
	client_email: z.string().email().max(320),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const ip = getClientIpForRateLimit(request);
    if (isRateLimited(`reprogramar:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Probá en un minuto." },
        { status: 429 }
      );
    }

    const { bookingId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const emailParsed = z.string().email().max(320).safeParse(email);
    if (!emailParsed.success) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, organization_id, client_email, client_name, service_id, date, start_time, reschedule_count, status")
      .eq("id", bookingId)
      .maybeSingle();

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
    const ip = getClientIpForRateLimit(request);
    if (isRateLimited(`reprogramar:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Probá en un minuto." },
        { status: 429 }
      );
    }

    const { bookingId } = await params;
    const rawBody = await request.json();
    const parsed = reprogramarBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { new_date, new_start_time, client_email } = parsed.data;

    const timeNorm = new_start_time.trim().slice(0, 5);
    if (!/^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeNorm)) {
      return NextResponse.json(
        { error: "Formato de hora inválido (usar HH:MM)" },
        { status: 400 },
      );
    }

    // Obtener reserva actual sin joins
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, organization_id, client_email, client_name, service_id, professional_id, date, start_time, end_time, price, status, reschedule_count")
      .eq("id", bookingId)
      .maybeSingle();

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
    const [hours, minutes] = timeNorm.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + (service?.duration || 30) * 60000);
    const new_end_time = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

    // Verificar disponibilidad del nuevo slot
    let availQuery = supabase
      .from("bookings")
      .select("id")
      .eq("organization_id", booking.organization_id)
      .eq("date", new_date)
      .neq("status", "cancelled")
      .neq("id", bookingId)
      // Solapamiento estándar: existe choque si (inicio_existente < fin_nuevo)
      // Y (fin_existente > inicio_nuevo). Cubre también la contención completa
      // (un turno corto dentro del nuevo rango), caso que la forma anterior de
      // dos condiciones no detectaba. Mismo criterio que el endpoint de book.
      .lt("start_time", new_end_time)
      .gt("end_time", timeNorm);

    if (booking.professional_id) {
      availQuery = availQuery.eq("professional_id", booking.professional_id);
    } else {
      availQuery = availQuery.is("professional_id", null);
    }

    const { data: existingBookings } = await availQuery;

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
          timeNorm >= slot.start_time &&
          timeNorm < slot.end_time
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
        start_time: timeNorm,
        end_time: new_end_time,
        reschedule_count: (booking.reschedule_count || 0) + 1,
        reminder_sent: false,
      })
      .eq("id", bookingId)
      .select()
      .maybeSingle();

    if (updateError) {
      // 23P01 = exclusion_violation: el constraint anti-solapamiento rechazó
      // el cambio por una carrera (otro tomó el hueco primero).
      if ((updateError as { code?: string }).code === "23P01") {
        return NextResponse.json(
          { error: "El nuevo horario ya no está disponible" },
          { status: 409 }
        );
      }
      console.error("Error reprogramando:", updateError);
      return NextResponse.json({ error: "Error al reprogramar" }, { status: 500 });
    }

    if (!updatedBooking) {
      return NextResponse.json({ error: "Error al reprogramar" }, { status: 500 });
    }

    // Enviar email de confirmación del cambio
    try {
      await sendRescheduleEmail({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        serviceName: service?.name || "Servicio",
        professionalName: professional?.name || null,
        date: new_date,
        time: timeNorm,
        price: booking.price || 0,
        businessName: business?.business_name || "Negocio",
        businessPhone: business?.phone || undefined,
        businessAddress: business?.address
          ? `${business.address}${business.city ? `, ${business.city}` : ""}`
          : undefined,
        bookingId,
        timezone: business?.timezone || "Europe/Madrid",
        previousDate: booking.date,
        previousTime: String(booking.start_time ?? ""),
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