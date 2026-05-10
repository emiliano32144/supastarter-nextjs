import sys

func = '''

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
'''

with open('apps/web/lib/email/booking-emails.ts', 'a', encoding='utf-8') as f:
    f.write(func)
print('OK')
