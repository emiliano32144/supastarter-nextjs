import { Resend } from 'resend';

// Helper: formatear fecha + hora en timezone del negocio
function formatDateTimeInTz(dateStr: string, timeStr: string, tz = 'Europe/Madrid') {
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
  cancellationFee?: number;
};

type BookingNotificationEmailData = BookingEmailData & {
  businessEmail: string;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://codetix.es';
}

function clientPortalLinks(data: BookingEmailData) {
  const base = getBaseUrl();
  const { bookingId, clientEmail } = data;
  const emailParam = clientEmail ? `?email=${encodeURIComponent(clientEmail)}` : '';
  return {
    misReservas: `${base}/mis-reservas${emailParam}`,
    cancelar: bookingId ? `${base}/booking/${bookingId}/cancelar${emailParam}` : null,
    reprogramar: bookingId ? `${base}/booking/${bookingId}/reprogramar${emailParam}` : null,
    fidelidad: bookingId ? `${base}/fidelidad/${bookingId}${emailParam}` : null,
  };
}

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
  const links = clientPortalLinks(data);

  const actionButtons = [];
  if (links.misReservas) {
    actionButtons.push(`<a href="${links.misReservas}" style="display:inline-block;padding:10px 18px;background:#1a1a1a;color:#D4AF37;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;margin-right:8px;">📅 Ver mis reservas</a>`);
  }
  if (links.cancelar) {
    actionButtons.push(`<a href="${links.cancelar}" style="display:inline-block;padding:10px 18px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;margin-right:8px;">✗ Cancelar</a>`);
  }
  if (links.reprogramar) {
    actionButtons.push(`<a href="${links.reprogramar}" style="display:inline-block;padding:10px 18px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">↻ Reprogramar (1 vez)</a>`);
  }

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: clientEmail,
      subject: `✅ Reserva confirmada - ${businessName}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1a1a1a,#333);padding:30px;text-align:center;">
      <h1 style="color:#D4AF37;margin:0;font-size:24px;">✂️ ${businessName}</h1>
      <p style="color:#fff;margin:10px 0 0;font-size:14px;">Reserva Confirmada</p>
    </div>
    <div style="padding:30px;">
      <p style="color:#333;margin:0 0 20px;">Hola <strong>${clientName}</strong>,</p>
      <p style="color:#666;margin:0 0 25px;">Tu cita ha sido confirmada. Aquí están los detalles:</p>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:25px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Servicio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Fecha y hora</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${formattedDate}</td></tr>
          ${professionalName ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Profesional</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${professionalName}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Precio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${price.toFixed(2)} €</td></tr>
        </table>
      </div>
      ${businessPhone || businessAddress ? `<div style="background:#f8f8f8;border-radius:8px;padding:15px;margin-bottom:25px;">
        ${businessPhone ? `<p style="margin:4px 0;font-size:13px;color:#666;">📞 ${businessPhone}</p>` : ''}
        ${businessAddress ? `<p style="margin:4px 0;font-size:13px;color:#666;">📍 ${businessAddress}</p>` : ''}
      </div>` : ''}
      <div style="margin-bottom:25px;">
        <p style="color:#666;font-size:13px;margin-bottom:12px;">¿Necesitás cambiar algo?</p>
        <div>${actionButtons.join('')}</div>
      </div>
      ${links.fidelidad ? `<div style="background:linear-gradient(135deg,#fef9e7,#f5f0d0);border-radius:8px;padding:15px;margin-bottom:20px;border-left:4px solid #D4AF37;">
        <p style="margin:0;font-size:13px;color:#7c6f3e;">🎖️ Esta cita suma puntos XP para tu fidelización. <a href="${links.fidelidad}" style="color:#b8860b;text-decoration:underline;font-weight:600;">Ver mis puntos →</a></p>
      </div>` : ''}
      <p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">Recibirás un recordatorio 24h antes de tu cita.</p>
    </div>
    <div style="background:#1a1a1a;padding:20px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">filo by Codetix — reservas@codetix.es</p>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error('Error enviando email de confirmación:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (err) {
    console.error('Error en sendBookingConfirmationEmail:', err);
    return { success: false, error: err };
  }
}

export type RescheduleEmailData = BookingEmailData & {
	previousDate: string;
	previousTime: string;
};

/** Email tras reprogramación (no usar confirmación inicial). */
export async function sendRescheduleEmail(data: RescheduleEmailData) {
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
		timezone = "Europe/Madrid",
		previousDate,
		previousTime,
	} = data;

	const formattedNew = formatDateTimeInTz(date, time, timezone);
	const formattedPrev = formatDateTimeInTz(previousDate, previousTime, timezone);
	const links = clientPortalLinks(data);

	const actionButtons = [];
	if (links.misReservas) {
		actionButtons.push(
			`<a href="${links.misReservas}" style="display:inline-block;padding:10px 18px;background:#1a1a1a;color:#D4AF37;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;margin-right:8px;">📅 Ver mis reservas</a>`,
		);
	}
	if (links.cancelar) {
		actionButtons.push(
			`<a href="${links.cancelar}" style="display:inline-block;padding:10px 18px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">✗ Cancelar</a>`,
		);
	}

	try {
		const resend = getResend();
		const { data: emailData, error } = await resend.emails.send({
			from: `${businessName} <reservas@codetix.es>`,
			to: clientEmail,
			subject: `📅 Cita reprogramada - ${businessName}`,
			html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1a1a1a,#333);padding:30px;text-align:center;">
      <h1 style="color:#D4AF37;margin:0;font-size:24px;">✂️ ${businessName}</h1>
      <p style="color:#fff;margin:10px 0 0;font-size:14px;">Cita reprogramada</p>
    </div>
    <div style="padding:30px;">
      <p style="color:#333;margin:0 0 20px;">Hola <strong>${clientName}</strong>,</p>
      <p style="color:#666;margin:0 0 25px;">Tu cita fue <strong>reprogramada</strong>. Ya no uses la fecha anterior.</p>
      <div style="background:#fff7ed;border-radius:8px;padding:16px;margin-bottom:16px;border-left:4px solid #f59e0b;">
        <p style="margin:0 0 8px;font-size:12px;color:#92400e;text-transform:uppercase;font-weight:700;">Antes</p>
        <p style="margin:0;font-size:15px;color:#78350f;">${formattedPrev}</p>
      </div>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:25px;">
        <p style="margin:0 0 8px;font-size:12px;color:#15803d;text-transform:uppercase;font-weight:700;">Nueva cita</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Servicio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Fecha y hora</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${formattedNew}</td></tr>
          ${professionalName ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Profesional</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${professionalName}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Precio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${price.toFixed(2)} €</td></tr>
        </table>
      </div>
      ${businessPhone || businessAddress ? `<div style="background:#f8f8f8;border-radius:8px;padding:15px;margin-bottom:25px;">
        ${businessPhone ? `<p style="margin:4px 0;font-size:13px;color:#666;">📞 ${businessPhone}</p>` : ""}
        ${businessAddress ? `<p style="margin:4px 0;font-size:13px;color:#666;">📍 ${businessAddress}</p>` : ""}
      </div>` : ""}
      <div style="margin-bottom:25px;">
        <div>${actionButtons.join("")}</div>
      </div>
      <p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">Solo se permite una reprogramación por reserva.</p>
    </div>
    <div style="background:#1a1a1a;padding:20px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">filo by Codetix — reservas@codetix.es</p>
    </div>
  </div>
</body>
</html>`,
		});

		if (error) {
			console.error("Error enviando email de reprogramación:", error);
			return { success: false, error };
		}

		return { success: true, data: emailData };
	} catch (err) {
		console.error("Error en sendRescheduleEmail:", err);
		return { success: false, error: err };
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
  const links = clientPortalLinks(data);

  const actionButtons = [];
  if (links.misReservas) {
    actionButtons.push(`<a href="${links.misReservas}" style="display:inline-block;padding:10px 18px;background:#1a1a1a;color:#D4AF37;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;margin-right:8px;">📅 Ver mis reservas</a>`);
  }
  if (links.cancelar) {
    actionButtons.push(`<a href="${links.cancelar}" style="display:inline-block;padding:10px 18px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;margin-right:8px;">✗ Cancelar</a>`);
  }
  if (links.reprogramar) {
    actionButtons.push(`<a href="${links.reprogramar}" style="display:inline-block;padding:10px 18px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">↻ Reprogramar (1 vez)</a>`);
  }

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: clientEmail,
      subject: `⏰ Recordatorio: Tu cita mañana en ${businessName}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1a1a1a,#333);padding:30px;text-align:center;">
      <h1 style="color:#D4AF37;margin:0;font-size:24px;">⏰ Recordatorio</h1>
      <p style="color:#fff;margin:10px 0 0;font-size:14px;">Tu cita es mañana</p>
    </div>
    <div style="padding:30px;">
      <p style="color:#333;margin:0 0 20px;">Hola <strong>${clientName}</strong>,</p>
      <p style="color:#666;margin:0 0 25px;">Te recordamos que tenés una cita programada:</p>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:25px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Servicio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Fecha y hora</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${formattedDate}</td></tr>
          ${professionalName ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Profesional</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${professionalName}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Precio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${price.toFixed(2)} €</td></tr>
        </table>
      </div>
      ${businessPhone || businessAddress ? `<div style="background:#f8f8f8;border-radius:8px;padding:15px;margin-bottom:25px;">
        ${businessPhone ? `<p style="margin:4px 0;font-size:13px;color:#666;">📞 ${businessPhone}</p>` : ''}
        ${businessAddress ? `<p style="margin:4px 0;font-size:13px;color:#666;">📍 ${businessAddress}</p>` : ''}
      </div>` : ''}
      <div style="margin-bottom:25px;">
        <p style="color:#666;font-size:13px;margin-bottom:12px;">¿Algo cambió?</p>
        <div>${actionButtons.join('')}</div>
      </div>
      ${links.fidelidad ? `<div style="background:linear-gradient(135deg,#fef9e7,#f5f0d0);border-radius:8px;padding:15px;margin-bottom:20px;border-left:4px solid #D4AF37;">
        <p style="margin:0;font-size:13px;color:#7c6f3e;">🎖️ No olvides que esta cita suma puntos XP. <a href="${links.fidelidad}" style="color:#b8860b;text-decoration:underline;font-weight:600;">Ver mis puntos →</a></p>
      </div>` : ''}
      <p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">Si no podés asistir, cancelá o reprogramá desde los botones de arriba.</p>
    </div>
    <div style="background:#1a1a1a;padding:20px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">filo by Codetix — reservas@codetix.es</p>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error('Error enviando recordatorio:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (err) {
    console.error('Error en sendBookingReminderEmail:', err);
    return { success: false, error: err };
  }
}

export async function sendBusinessNotificationEmail(data: BookingNotificationEmailData) {
  const {
    clientName,
    clientEmail,
    serviceName,
    professionalName,
    date,
    time,
    price,
    businessName,
    businessEmail,
    timezone = 'Europe/Madrid',
  } = data;

  const formattedDate = formatDateTimeInTz(date, time, timezone);

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: "filo <reservas@codetix.es>",
      to: businessEmail,
      subject: `📅 Nueva reserva - ${clientName}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1a1a1a,#333);padding:30px;text-align:center;">
      <h1 style="color:#D4AF37;margin:0;font-size:24px;">📅 Nueva Reserva</h1>
      <p style="color:#fff;margin:10px 0 0;font-size:14px;">${businessName}</p>
    </div>
    <div style="padding:30px;">
      <p style="color:#333;margin:0 0 20px;">Tenés una nueva reserva:</p>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:25px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Cliente</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${clientName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Email</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${clientEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Servicio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Fecha y hora</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${formattedDate}</td></tr>
          ${professionalName ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Profesional</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${professionalName}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Precio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${price.toFixed(2)} €</td></tr>
        </table>
      </div>
      <p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">Gestiona esta reserva desde tu panel de administración.</p>
    </div>
    <div style="background:#1a1a1a;padding:20px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">filo by Codetix — reservas@codetix.es</p>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error('Error enviando notificación al negocio:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (err) {
    console.error('Error en sendBusinessNotificationEmail:', err);
    return { success: false, error: err };
  }
}

export async function sendCancellationEmail(data: BookingEmailData) {
  const {
    clientName,
    clientEmail,
    serviceName,
    date,
    time,
    businessName,
    timezone = 'Europe/Madrid',
    cancellationFee,
  } = data;

  const formattedDate = formatDateTimeInTz(date, time, timezone);
  const feeBanner = cancellationFee
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin-bottom:20px;text-align:center;">
        <p style="color:#991b1b;margin:0;font-size:15px;font-weight:700;">Cancelación tardía</p>
        <p style="color:#dc2626;margin:8px 0 0;font-size:22px;font-weight:800;">€${cancellationFee.toFixed(2)}</p>
        <p style="color:#7f1d1d;margin:6px 0 0;font-size:12px;">Este importe corresponde al fee configurado por el salón.</p>
      </div>`
    : "";
  const feeHtml = cancellationFee
    ? `
        <tr><td style="padding:8px 0;color:#888;font-size:13px;">Fee por cancelación tardía</td><td style="padding:8px 0;color:#dc2626;font-size:14px;text-align:right;font-weight:600;">€${cancellationFee.toFixed(2)}</td></tr>`
    : "";

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: clientEmail,
      subject: `✗ Reserva cancelada - ${businessName}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:30px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">✗ Reserva Cancelada</h1>
      <p style="color:#fff;margin:10px 0 0;font-size:14px;opacity:0.9;">${businessName}</p>
    </div>
    <div style="padding:30px;">
      <p style="color:#333;margin:0 0 20px;">Hola <strong>${clientName}</strong>,</p>
      <p style="color:#666;margin:0 0 25px;">Tu reserva ha sido cancelada:</p>
      ${feeBanner}
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:25px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Servicio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Fecha y hora</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${formattedDate}</td></tr>${feeHtml}
        </table>
      </div>
      <p style="color:#666;margin:0 0 20px;">Si querés volver a reservar, podés hacerlo desde nuestra página:</p>
      <a href="${getBaseUrl()}/reservas" style="display:inline-block;padding:12px 24px;background:#1a1a1a;color:#D4AF37;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Reservar de nuevo →</a>
      <p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">Si no fuiste vos quien canceló, contactá al salón.</p>
    </div>
    <div style="background:#1a1a1a;padding:20px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">filo by Codetix — reservas@codetix.es</p>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error('Error enviando email de cancelación:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (err) {
    console.error('Error en sendCancellationEmail:', err);
    return { success: false, error: err };
  }
}


export async function sendBookingPendingConfirmationEmail(params: {
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
  confirmUrl: string;
  timezone: string;
}) {
  const {
    clientName, clientEmail, serviceName, professionalName,
    date, time, price, businessName, businessPhone,
    businessAddress, confirmUrl, timezone,
  } = params;

  const formatted = formatDateTimeInTz(date, time, timezone);

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: clientEmail,
      subject: `⏳ Confirmá tu reserva en ${businessName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <div style="background:#F59E0B;padding:32px 24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">⏳ Confirmá tu reserva</h1>
            <p style="color:#fff;margin:8px 0 0;opacity:0.9">Tenés 30 minutos para confirmar</p>
          </div>
          <div style="padding:28px 24px">
            <p style="color:#374151;font-size:16px">Hola <strong>${clientName}</strong>,</p>
            <p style="color:#374151">Para completar tu reserva en <strong>${businessName}</strong>, hacé click en el botón de abajo. Si no confirmás en 30 minutos, el horario se libera.</p>

            <div style="background:#F9FAFB;border-radius:8px;padding:16px;margin:20px 0">
              <p style="margin:4px 0;color:#374151"><strong>Servicio:</strong> ${serviceName}</p>
              ${professionalName ? `<p style="margin:4px 0;color:#374151"><strong>Profesional:</strong> ${professionalName}</p>` : ''}
              <p style="margin:4px 0;color:#374151"><strong>Fecha:</strong> ${formatted}</p>
              <p style="margin:4px 0;color:#374151"><strong>Precio:</strong> €${price.toFixed(2)}</p>
              ${businessAddress ? `<p style="margin:4px 0;color:#374151"><strong>Dirección:</strong> ${businessAddress}</p>` : ''}
              ${businessPhone ? `<p style="margin:4px 0;color:#374151"><strong>Teléfono:</strong> ${businessPhone}</p>` : ''}
            </div>

            <div style="text-align:center;margin:28px 0">
              <a href="${confirmUrl}" style="background:#F59E0B;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
                ✅ Confirmar mi reserva
              </a>
            </div>

            <p style="color:#9CA3AF;font-size:13px;text-align:center">
              Este link expira en 30 minutos. Si no pediste esta reserva, ignorá este email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error enviando email de confirmación pendiente:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (err) {
    console.error('Error en sendBookingPendingConfirmationEmail:', err);
    return { success: false, error: err };
  }
}

export async function sendBookingCompletedEmail(data: BookingEmailData & { xpEarned?: number; totalXp?: number; nextLevel?: string; nextReward?: string }) {
  const {
    clientName, clientEmail, serviceName, professionalName, date, time, price,
    businessName, businessPhone, businessAddress,
    xpEarned, totalXp, nextLevel, nextReward,
    timezone = 'Europe/Madrid',
  } = data;

  const formattedDate = formatDateTimeInTz(date, time, timezone);

  let xpHtml = '';
  if (typeof xpEarned === 'number') {
    xpHtml = `<div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:25px;"><p style="color:#333;margin:0 0 15px;font-weight:600;">🎉 Puntos ganados: +${xpEarned} XP</p><p style="color:#666;margin:0 0 15px;">Total acumulado: ${totalXp ?? 0} XP</p>${nextLevel ? `<p style="color:#D4AF37;margin:0;font-weight:600;">¡Subiste a ${nextLevel}!</p>` : ''}${nextReward ? `<p style="color:#666;margin:10px 0 0;">${nextReward}</p>` : ''}</div>`;
  }

  try {
    const resend = getResend();
    const { data: emailData, error } = await resend.emails.send({
      from: `${businessName} <reservas@codetix.es>`,
      to: clientEmail,
      subject: `✅ Reserva completada - ${businessName}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:20px;"><div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);"><div style="background:linear-gradient(135deg,#1a1a1a,#333);padding:30px;text-align:center;"><h1 style="color:#D4AF37;margin:0;font-size:24px;">✅ Reserva Completada</h1><p style="color:#fff;margin:10px 0 0;font-size:14px;">${businessName}</p></div><div style="padding:30px;"><p style="color:#333;margin:0 0 20px;">Hola <strong>${clientName}</strong>,</p><p style="color:#666;margin:0 0 25px;">Tu cita fue completada exitosamente:</p><div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:25px;"><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px 0;color:#888;font-size:13px;">Servicio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${serviceName}</td></tr>${professionalName ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Profesional</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${professionalName}</td></tr>` : ''}<tr><td style="padding:8px 0;color:#888;font-size:13px;">Fecha y hora</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${formattedDate}</td></tr><tr><td style="padding:8px 0;color:#888;font-size:13px;">Precio</td><td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${price.toFixed(2)} €</td></tr></table></div>${xpHtml}<p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">Gracias por confiar en ${businessName}. ¡Te esperamos pronto!</p></div><div style="background:#1a1a1a;padding:20px;text-align:center;"><p style="color:#888;font-size:12px;margin:0;">filo by Codetix — reservas@codetix.es</p></div></div></body></html>`,
    });
    if (error) { console.error('Error enviando email de completado:', error); return { success: false, error }; }
    return { success: true, data: emailData };
  } catch (err) {
    console.error('Error en sendBookingCompletedEmail:', err);
    return { success: false, error: err };
  }
}
