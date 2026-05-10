import { Resend } from 'resend';

// Helper: formatear fecha + hora en timezone del negocio
function formatDateTimeInTz(dateStr: string, timeStr: string, tz: string = 'Europe/Madrid') {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = (timeStr || '00:00').split(':').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return `${dateStr} ${timeStr}`;
  }
}

// Inicializar Resend solo cuando se necesite (evita errores durante build si no hay API key)
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no está configurada');
  }
  return new Resend(apiKey);
};

export type BookingEmailData = {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  professionalName: string | null;
  date: string;
  time: string;
  price: number;
  businessName: string;
  businessPhone?: string;
  businessAddress?: string;
  bookingId?: string;
  timezone?: string;
};

type BookingNotificationEmailData = BookingEmailData & {
  businessEmail: string;
};

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const {
    clientName,
    clientEmail,
    serviceName,
    professionalName,
    date,
    time,
    price,
    businessName,
    businessPhone,
    businessAddress,
    timezone = 'Europe/Madrid',
  } = data;

  const formattedDate = formatDateTimeInTz(date, time, timezone);

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: clientEmail,
      subject: `✅ Reserva confirmada - ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 30px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">✂️ ${businessName}</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Reserva Confirmada</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #333; margin: 0 0 20px 0;">Hola <strong>${clientName}</strong>,</p>
              <p style="color: #666; margin: 0 0 25px 0;">Tu cita ha sido confirmada. Aquí están los detalles:</p>
              
              <!-- Booking Details -->
              <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Servicio</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Fecha</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Hora</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${time}</td>
                  </tr>
                  ${professionalName ? `
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Profesional</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${professionalName}</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 1px solid #eee;">
                    <td style="padding: 12px 0 0 0; color: #888; font-size: 13px;">Total</td>
                    <td style="padding: 12px 0 0 0; color: #D4AF37; font-size: 18px; text-align: right; font-weight: 700;">${price}€</td>
                  </tr>
                </table>
              </div>
              
              <!-- Location -->
              ${businessAddress ? `
              <div style="margin-bottom: 25px;">
                <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">📍 UBICACIÓN</p>
                <p style="color: #333; font-size: 14px; margin: 0;">${businessAddress}</p>
              </div>
              ` : ''}
              
              <!-- Contact -->
              ${businessPhone ? `
              <div style="margin-bottom: 25px;">
                <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">📞 CONTACTO</p>
                <p style="color: #333; font-size: 14px; margin: 0;">${businessPhone}</p>
              </div>
              ` : ''}
              
              <!-- CTA -->
              <div style="margin: 25px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/reservas/${bookingId}/cancelar?email=${encodeURIComponent(clientEmail)}" 
                   style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                  ✗ Cancelar reserva
                </a>
              </div>
              <div style="margin: 15px 0; text-align: center;">
              <div style="margin: 15px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/reservas/${bookingId}/reprogramar?email=${encodeURIComponent(clientEmail)}" 
                   style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
                  ? Reprogramar cita (1 vez)
                </a>
              </div>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/fidelidad/${bookingId}?email=${encodeURIComponent(clientEmail)}" 
                   style="display: inline-block; padding: 10px 20px; background: #D4AF37; color: #1a1a1a; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
                  🎖️ Ver mis puntos de fidelización
                </a>
              </div>
              <p style="color: #666; font-size: 13px; margin: 25px 0 0 0; text-align: center;">
                Si necesitas cancelar o modificar tu cita, contáctanos con al menos 24h de antelación.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0;">¡Te esperamos!</p>
              <p style="color: #D4AF37; font-size: 14px; font-weight: 600; margin: 5px 0 0 0;">${businessName}</p>
            </div>
            
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendBookingReminderEmail(data: BookingEmailData) {
  const {
    clientName,
    clientEmail,
    serviceName,
    professionalName,
    date,
    time,
    price,
    businessName,
    businessPhone,
    businessAddress,
    timezone = 'Europe/Madrid',
  } = data;

  const formattedDate = formatDateTimeInTz(date, time, timezone);

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: clientEmail,
      subject: `📅 Recordatorio: Tu cita es mañana - ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 30px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">✂️ ${businessName}</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Recordatorio de Cita</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #333; margin: 0 0 20px 0;">Hola <strong>${clientName}</strong>,</p>
              <p style="color: #666; margin: 0 0 25px 0;">Te recordamos que tienes una cita mañana. Aquí están los detalles:</p>
              
              <!-- Booking Details -->
              <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Servicio</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Fecha</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Hora</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${time}</td>
                  </tr>
                  ${professionalName ? `
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Profesional</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${professionalName}</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 1px solid #eee;">
                    <td style="padding: 12px 0 0 0; color: #888; font-size: 13px;">Total</td>
                    <td style="padding: 12px 0 0 0; color: #D4AF37; font-size: 18px; text-align: right; font-weight: 700;">${price}€</td>
                  </tr>
                </table>
              </div>
              
              <!-- Location -->
              ${businessAddress ? `
              <div style="margin-bottom: 25px;">
                <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">📍 UBICACIÓN</p>
                <p style="color: #333; font-size: 14px; margin: 0;">${businessAddress}</p>
              </div>
              ` : ''}
              
              <!-- Contact -->
              ${businessPhone ? `
              <div style="margin-bottom: 25px;">
                <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">📞 CONTACTO</p>
                <p style="color: #333; font-size: 14px; margin: 0;">${businessPhone}</p>
              </div>
              ` : ''}
              
              <!-- CTA -->
              <p style="color: #666; font-size: 13px; margin: 25px 0 0 0; text-align: center;">
              <!-- CTA -->
              <div style="margin: 25px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/reservas/${bookingId}/cancelar?email=${encodeURIComponent(clientEmail)}" 
                   style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                  ? Cancelar reserva
                </a>
              </div>
              <div style="margin: 15px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/reservas/${bookingId}/reprogramar?email=${encodeURIComponent(clientEmail)}" 
                   style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
                  ? Cambiar horario (1 vez)
                </a>
              </div>
                Si necesitas cancelar o modificar tu cita, contáctanos con al menos 24h de antelación.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0;">¡Te esperamos!</p>
              <p style="color: #D4AF37; font-size: 14px; font-weight: 600; margin: 5px 0 0 0;">${businessName}</p>
            </div>
            
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending reminder email:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending reminder email:', JSON.stringify(error, null, 2));
    return { success: false, error };
  }
}

export async function sendBookingNotificationEmail(
  data: BookingNotificationEmailData,
) {
  const {
    clientName,
    clientEmail,
    serviceName,
    professionalName,
    date,
    time,
    price,
    businessName,
    businessPhone,
    businessAddress,
    businessEmail,
    timezone = 'Europe/Madrid',
  } = data;

  const formattedDate = formatDateTimeInTz(date, time, timezone);

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: businessEmail,
      subject: `🔔 Nueva reserva — ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 28px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 22px;">✂️ ${businessName}</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Nueva reserva recibida</p>
            </div>

            <div style="padding: 28px;">
              <p style="color: #333; margin: 0 0 8px 0;">Se ha registrado una nueva reserva desde la página pública.</p>

              <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 22px 0;">
                <p style="color: #888; font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Cliente</p>
                <p style="color: #333; margin: 0 0 6px 0; font-size: 15px;"><strong>${clientName}</strong></p>
                <p style="color: #555; margin: 0; font-size: 14px;">
                  <a href="mailto:${clientEmail}" style="color: #2563eb;">${clientEmail}</a>
                </p>
              </div>

              <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Servicio</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Fecha</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Hora</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${time}</td>
                  </tr>
                  ${professionalName ? `
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Profesional</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${professionalName}</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 1px solid #eee;">
                    <td style="padding: 12px 0 0 0; color: #888; font-size: 13px;">Importe</td>
                    <td style="padding: 12px 0 0 0; color: #D4AF37; font-size: 18px; text-align: right; font-weight: 700;">${price}€</td>
                  </tr>
                </table>
              </div>

              ${businessAddress ? `
              <div style="margin-bottom: 18px;">
                <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">📍 UBICACIÓN DEL NEGOCIO</p>
                <p style="color: #333; font-size: 14px; margin: 0;">${businessAddress}</p>
              </div>
              ` : ''}

              ${businessPhone ? `
              <div style="margin-bottom: 0;">
                <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">📞 TELÉFONO NEGOCIO</p>
                <p style="color: #333; font-size: 14px; margin: 0;">${businessPhone}</p>
              </div>
              ` : ''}
            </div>

            <div style="background: #f8f8f8; padding: 16px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 11px; margin: 0;">Este correo es informativo para el equipo de ${businessName}.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending salon notification email:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending salon notification email:', JSON.stringify(error, null, 2));
    return { success: false, error };
  }
}

export async function sendBookingCancellationEmail(data: BookingEmailData) {
  const {
    clientName,
    clientEmail,
    serviceName,
    professionalName,
    date,
    time,
    businessName,
    timezone = 'Europe/Madrid',
  } = data;

  const formattedDate = formatDateTimeInTz(date, time, timezone);

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: clientEmail,
      subject: `❌ Tu reserva ha sido cancelada - ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 30px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">✂️ ${businessName}</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Reserva Cancelada</p>
            </div>

            <div style="padding: 30px;">
              <p style="color: #333; margin: 0 0 20px 0;">Hola <strong>${clientName}</strong>,</p>
              <p style="color: #666; margin: 0 0 25px 0;">Lamentamos informarte que tu cita ha sido <strong>cancelada</strong>. Aquí están los detalles:</p>

              <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Servicio</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Fecha</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Hora</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${time}</td>
                  </tr>
                  ${
                    professionalName
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 13px;">Profesional</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${professionalName}</td>
                  </tr>
                  `
                      : ""
                  }
                </table>
              </div>

              <p style="color: #666; font-size: 13px; margin: 25px 0 0 0; text-align: center;">
                Si tienes alguna duda, contáctanos. Puedes volver a reservar en cualquier momento.
              </p>
            </div>

            <div style="background: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0;">Disculpa las molestias</p>
              <p style="color: #D4AF37; font-size: 14px; font-weight: 600; margin: 5px 0 0 0;">${businessName}</p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending cancellation email:", error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return { success: false, error };
  }
}

export async function sendBookingCompletedEmail(
  data: BookingEmailData & {
    xpEarned: number;
    totalXp: number;
    nextLevel?: string;
    nextReward?: string;
  },
) {
  const {
    clientName,
    clientEmail,
    serviceName,
    professionalName,
    date,
    time,
    businessName,
    xpEarned,
    totalXp,
    nextLevel,
    nextReward,
  } = data;

  const formattedDate = new Date(date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  try {
    const resend = getResend();
    const { data: emailPayload, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: clientEmail,
      subject: `🎉 ¡Cita completada! +${xpEarned} XP - ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 30px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">✂️ ${businessName}</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">¡Gracias por tu visita!</p>
            </div>

            <div style="padding: 30px;">
              <p style="color: #333; margin: 0 0 20px 0;">Hola <strong>${clientName}</strong>,</p>
              <p style="color: #666; margin: 0 0 25px 0;">Tu cita del ${formattedDate} ha sido completada. ¡Esperamos verte pronto!</p>

              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
                <div style="color: #D4AF37; font-size: 48px; font-weight: 700; margin-bottom: 10px;">+${xpEarned} XP</div>
                <div style="color: #ffffff; font-size: 16px; margin-bottom: 5px;">XP Total: ${totalXp}</div>
                ${
                  nextLevel
                    ? `
                <div style="color: #D4AF37; font-size: 14px; margin-top: 15px;">
                  🎯 Te faltan puntos para <strong>${nextLevel}</strong>
                </div>
                `
                    : ""
                }
                ${
                  nextReward
                    ? `
                <div style="color: #ffffff; font-size: 13px; margin-top: 10px;">
                  🎁 Próxima recompensa: ${nextReward}
                </div>
                `
                    : ""
                }
              </div>

              <p style="color: #666; font-size: 13px; margin: 25px 0 0 0; text-align: center;">
                Reserva tu próxima cita y sigue acumulando puntos.
              </p>
            </div>

            <div style="background: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0;">¡Te esperamos pronto!</p>
              <p style="color: #D4AF37; font-size: 14px; font-weight: 600; margin: 5px 0 0 0;">${businessName}</p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending completed email:", error);
      return { success: false, error };
    }

    return { success: true, data: emailPayload };
  } catch (error) {
    console.error("Error sending completed email:", error);
    return { success: false, error };
  }
}