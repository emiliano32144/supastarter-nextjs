import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingConfirmationEmail } from "../../../../../../lib/email/booking-emails";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://filo.com.es";

  if (!token) {
    return NextResponse.redirect(
      `${baseUrl}/booking/${bookingId}/confirmar?error=missing_token`,
    );
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, status, confirmation_token, confirmation_expires_at, client_name, client_email, date, start_time, price, service_id, professional_id, organization_id",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.redirect(
      `${baseUrl}/booking/${bookingId}/confirmar?error=not_found`,
    );
  }

  if (booking.status === "pending" || booking.status === "confirmed") {
    return NextResponse.redirect(
      `${baseUrl}/booking/${bookingId}/confirmar?success=already`,
    );
  }

  if (booking.status !== "awaiting_confirmation") {
    return NextResponse.redirect(
      `${baseUrl}/booking/${bookingId}/confirmar?error=invalid_status`,
    );
  }

  if (booking.confirmation_token !== token) {
    return NextResponse.redirect(
      `${baseUrl}/booking/${bookingId}/confirmar?error=invalid_token`,
    );
  }

  if (new Date(booking.confirmation_expires_at) < new Date()) {
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    return NextResponse.redirect(
      `${baseUrl}/booking/${bookingId}/confirmar?error=expired`,
    );
  }

  await supabase
    .from("bookings")
    .update({ status: "pending", confirmation_token: null })
    .eq("id", bookingId);

  const [{ data: service }, { data: professional }, { data: businessConfig }] =
    await Promise.all([
      booking.service_id
        ? supabase
            .from("services")
            .select("name")
            .eq("id", booking.service_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      booking.professional_id
        ? supabase
            .from("professionals")
            .select("name")
            .eq("id", booking.professional_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("business_config")
        .select("business_name, phone, address, city, timezone, email")
        .eq("organization_id", booking.organization_id)
        .maybeSingle(),
    ]);

  try {
    await sendBookingConfirmationEmail({
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      serviceName: service?.name || "Servicio",
      professionalName: professional?.name || null,
      date: booking.date,
      time: booking.start_time,
      price: booking.price || 0,
      businessName: businessConfig?.business_name || "Barbería",
      businessPhone: businessConfig?.phone || undefined,
      businessAddress: businessConfig?.address
        ? `${businessConfig.address}${businessConfig.city ? `, ${businessConfig.city}` : ""}`
        : undefined,
      bookingId: booking.id,
      timezone: businessConfig?.timezone || "Europe/Madrid",
    });
  } catch (e) {
    console.error("Error enviando email de confirmación:", e);
  }

  return NextResponse.redirect(
    `${baseUrl}/booking/${bookingId}/confirmar?success=true`,
  );
}
