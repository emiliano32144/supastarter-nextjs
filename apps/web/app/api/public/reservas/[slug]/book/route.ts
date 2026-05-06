import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendBookingConfirmationEmail,
  sendBookingNotificationEmail,
} from "../../../../../../lib/email/booking-emails";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    
    const {
      service_id,
      professional_id,
      client_name,
      client_email,
      client_phone,
      date,
      start_time,
      notes,
    } = body;

    // Validar campos requeridos
    if (!service_id || !client_name || !client_email || !client_phone || !date || !start_time) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

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

    // Obtener servicio completo (necesitamos name también)
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, name, duration, price")
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    // Calcular hora de fin
    const [hours, minutes] = start_time.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + service.duration * 60000);
    const end_time = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

    // Verificar disponibilidad (no hay otra reserva en ese horario)
    const { data: existingBookings, error: checkError } = await supabase
      .from("bookings")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("date", date)
      .eq("professional_id", professional_id)
      .neq("status", "cancelled")
      .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time})`);

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: "Este horario ya no está disponible" },
        { status: 409 }
      );
    }

    // Buscar o crear cliente
    let client_id = null;
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", client_email)
      .single();

    if (existingClient) {
      client_id = existingClient.id;
      // Actualizar último contacto
      await supabase
        .from("clients")
        .update({ 
          last_visit: new Date().toISOString(),
        })
        .eq("id", client_id);
    } else {
      // Crear nuevo cliente
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          organization_id: organizationId,
          name: client_name,
          email: client_email,
          phone: client_phone,
          total_visits: 1,
          last_visit: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (newClient) {
        client_id = newClient.id;
      }
    }

    // Crear la reserva
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        organization_id: organizationId,
        client_id,
        professional_id: professional_id || null,
        service_id,
        client_name,
        client_email,
        client_phone,
        date,
        start_time,
        end_time,
        status: "pending",
        notes: notes || null,
        price: service.price,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      return NextResponse.json({ error: "Error al crear la reserva" }, { status: 500 });
    }

    // Obtener información del profesional si existe
    let professional = null;
    if (professional_id) {
      const { data: profData } = await supabase
        .from("professionals")
        .select("name")
        .eq("id", professional_id)
        .single();
      if (profData) {
        professional = profData;
      }
    }

    // Enviar email de confirmación
    try {
      console.log('📧 Intentando enviar email a:', client_email);
      const emailResult = await sendBookingConfirmationEmail({
        clientName: client_name,
        clientEmail: client_email,
        serviceName: service?.name || 'Servicio',
        professionalName: professional?.name || null,
        date: date,
        time: start_time,
        price: service?.price || 0,
        businessName: businessConfig?.business_name || 'Barbería',
        businessPhone: businessConfig?.phone || undefined,
        businessAddress: businessConfig?.address ? `${businessConfig.address}${businessConfig.city ? `, ${businessConfig.city}` : ''}` : undefined,
        bookingId: booking.id,
      });
      console.log('📧 Resultado del email:', emailResult);
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError);
    }

    if (businessConfig?.email) {
      try {
        const notifyResult = await sendBookingNotificationEmail({
          clientName: client_name,
          clientEmail: client_email,
          serviceName: service?.name || 'Servicio',
          professionalName: professional?.name || null,
          date: date,
          time: start_time,
          price: service?.price || 0,
          businessName: businessConfig?.business_name || 'Barbería',
          businessPhone: businessConfig?.phone || undefined,
          businessAddress: businessConfig?.address ? `${businessConfig.address}${businessConfig.city ? `, ${businessConfig.city}` : ''}` : undefined,
          businessEmail: businessConfig.email,
        });
        console.log('📧 Notificación peluquero:', notifyResult);
      } catch (notifyError) {
        console.error('❌ Error notificación peluquero:', notifyError);
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
      },
      message: "Reserva creada exitosamente",
    });

  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

