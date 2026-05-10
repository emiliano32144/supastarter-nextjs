import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Buscar la reserva
    const { data: booking, error: findError } = await supabase
      .from("bookings")
      .select("id, client_email, status")
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

    return NextResponse.json({ success: true, message: "Reserva cancelada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
