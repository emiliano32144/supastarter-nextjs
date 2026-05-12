import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCancellationEmail } from "../../../../../../lib/email/booking-emails";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function appointmentLocalDateTime(date: string, startTime: string, timezone: string = 'Europe/Madrid'): Date {
  const t = String(startTime || "00:00").replace(/(\.\d+)?\+.*$/, "").trim();
  const hm = t.length >= 5 ? t.slice(0, 5) : "00:00";

  // Crear un Date que representa la fecha/hora en la timezone del negocio
  // No podemos usar new Date() directamente porque parsea en UTC local del servidor
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = hm.split(':').map(Number);

  // Usar Intl.DateTimeFormat para obtener la representación correcta en la timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  // Crear una fecha UTC con los componentes correctos
  const utcCandidate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = formatter.formatToParts(utcCandidate.getTime());
  const p = (type: string) => parts.find(part => part.type === type)?.value || '0';

  // Obtener la fecha/hora en la timezone del negocio
  const tzYear = parseInt(p('year'));
  const tzMonth = parseInt(p('month')) - 1;
  const tzDay = parseInt(p('day'));
  const tzHour = parseInt(p('hour'));
  const tzMinute = parseInt(p('minute'));

  // Crear un Date local que representa la misma hora de reloj en la timezone del negocio
  return new Date(tzYear, tzMonth, tzDay, tzHour, tzMinute, 0);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { client_email } = body;

    // Buscar la reserva
    const { data: booking, error: findError } = await supabase
      .from("bookings")
      .select("id, organization_id, client_name, client_email, date, start_time, price, service_id, professional_id, status")
      .eq("id", bookingId)
      .single();

    if (findError || !booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar email
    if (booking.client_email !== client_email) {
      return NextResponse.json(
        { error: "Email no coincide con la reserva" },
        { status: 403 }
      );
    }

    // Obtener config del negocio para fee de cancelación
    const { data: businessConfig } = await supabase
      .from("business_config")
      .select("cancellation_fee_enabled, cancellation_fee_amount, cancellation_fee_hours, timezone, business_name, phone, address, city")
      .eq("organization_id", booking.organization_id)
      .single();

    // Calcular si aplica fee
    let cancellationFeeApplied = false;
    let cancellationFeeAmount = 0;

    if (businessConfig?.cancellation_fee_enabled) {
      const tz = businessConfig?.timezone || 'Europe/Madrid';
      const appointmentDate = appointmentLocalDateTime(
        booking.date,
        String(booking.start_time),
        tz,
      );
      const now = new Date();
      const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const feeHours = businessConfig.cancellation_fee_hours || 24;

      if (hoursUntil < feeHours && hoursUntil > 0) {
        cancellationFeeApplied = true;
        cancellationFeeAmount = businessConfig.cancellation_fee_amount || 0.50;
      }
    }

    // Soft delete (con fee si aplica)
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancellation_fee_applied: cancellationFeeApplied,
        cancellation_fee_amount: cancellationFeeAmount,
      })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { error: "Error al cancelar la reserva" },
        { status: 500 }
      );
    }

    // Enviar email de cancelación al cliente
    try {
      const [{ data: service }, { data: professional }] = await Promise.all([
        booking.service_id ? supabase.from("services").select("name").eq("id", booking.service_id).maybeSingle() : Promise.resolve({ data: null }),
        booking.professional_id ? supabase.from("professionals").select("name").eq("id", booking.professional_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      await sendCancellationEmail({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        serviceName: service?.name || 'Servicio',
        professionalName: professional?.name || null,
        date: booking.date,
        time: booking.start_time,
        price: booking.price || 0,
        businessName: businessConfig?.business_name || 'Barbería',
        businessPhone: businessConfig?.phone || undefined,
        businessAddress: businessConfig?.address ? `${businessConfig.address}${businessConfig.city ? `, ${businessConfig.city}` : ''}` : undefined,
        timezone: businessConfig?.timezone || 'Europe/Madrid',
        cancellationFee: cancellationFeeApplied ? cancellationFeeAmount : undefined,
      });
    } catch (emailError) {
      console.error('❌ Error enviando email de cancelación:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: cancellationFeeApplied
        ? `Reserva cancelada. Se aplicó un fee de €${cancellationFeeAmount.toFixed(2)} por cancelación tardía.`
        : "Reserva cancelada",
      cancellationFee: cancellationFeeApplied ? cancellationFeeAmount : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
