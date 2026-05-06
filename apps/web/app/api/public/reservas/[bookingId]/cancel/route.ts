import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const { clientEmail } = await request.json();

    // 1. Obtener booking
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // 2. Verificar que el email coincide (token simple)
    if (booking.client_email !== clientEmail) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // 3. Verificar que no esté ya cancelada
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "La reserva ya está cancelada" },
        { status: 400 }
      );
    }

    // 4. Soft delete: cambiar status a 'cancelled'
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Error cancelling booking:", updateError);
      return NextResponse.json(
        { error: "Error al cancelar la reserva" },
        { status: 500 }
      );
    }

    // 5. Enviar email al peluquero
    try {
      const { data: businessConfig } = await supabase
        .from("business_config")
        .select("business_name, email")
        .eq("organization_id", booking.organization_id)
        .single();

      if (businessConfig?.email && booking.client_email) {
        const { sendBookingCancellationEmail } = await import("../../../../../../lib/email/booking-emails");
        await sendBookingCancellationEmail({
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          serviceName: "Servicio",
          professionalName: null,
          date: booking.date,
          time: booking.start_time,
          price: booking.price || 0,
          businessName: businessConfig.business_name || "Barbería",
          businessPhone: businessConfig.phone || undefined,
          businessAddress: businessConfig.address || undefined,
        });

        const { sendBookingNotificationEmail } = await import("../../../../../../lib/email/booking-emails");
        await sendBookingNotificationEmail({
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          serviceName: "Servicio",
          professionalName: null,
          date: booking.date,
          time: booking.start_time,
          price: booking.price || 0,
          businessName: businessConfig.business_name || "Barbería",
          businessEmail: businessConfig.email,
        });
      }
    } catch (emailError) {
      console.error("Error sending cancellation emails:", emailError);
      // No fallar si el email falla
    }

    return NextResponse.json({
      success: true,
      message: "Reserva cancelada correctamente",
    });
  } catch (error) {
    console.error("Error in cancel booking:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
