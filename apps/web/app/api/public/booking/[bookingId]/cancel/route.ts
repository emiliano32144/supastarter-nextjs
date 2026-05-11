import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCancellationEmail } from "../../../../../../lib/email/booking-emails";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { client_email } = body;

    // Buscar la reserva con datos completos
    const { data: booking, error: findError } = await supabase
      .from("bookings")
      .select("*, services(name), professionals(name)")
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

    // Soft delete
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { error: "Error al cancelar la reserva" },
        { status: 500 }
      );
    }

    // Enviar email de cancelación al cliente
    try {
      const { data: businessConfig } = await supabase
        .from("business_config")
        .select("business_name, phone, address, city, timezone")
        .eq("organization_id", booking.organization_id)
        .maybeSingle();

      await sendCancellationEmail({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        serviceName: booking.services?.name || 'Servicio',
        professionalName: booking.professionals?.name || null,
        date: booking.date,
        time: booking.start_time,
        price: booking.price || 0,
        businessName: businessConfig?.business_name || 'Barbería',
        businessPhone: businessConfig?.phone || undefined,
        businessAddress: businessConfig?.address ? `${businessConfig.address}${businessConfig.city ? `, ${businessConfig.city}` : ''}` : undefined,
        timezone: businessConfig?.timezone || 'Europe/Madrid',
      });
    } catch (emailError) {
      console.error('❌ Error enviando email de cancelación:', emailError);
    }

    return NextResponse.json({ success: true, message: "Reserva cancelada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
