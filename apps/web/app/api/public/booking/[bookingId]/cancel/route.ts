import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { sendCancellationEmail } from "../../../../../../lib/email/booking-emails";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const cancelBodySchema = z.object({
	client_email: z.string().email().max(320),
});

/** Instante UTC de la cita interpretando `date` + `startTime` en la zona del negocio (evita drift en Vercel UTC). */
export function appointmentInstantUtc(
	dateStr: string,
	startTime: unknown,
	timeZone: string,
): Date {
	const raw = String(startTime ?? "00:00").replace(/(\.\d+)?\+.*$/, "").trim();
	const hm = raw.length >= 5 ? raw.slice(0, 5) : "00:00";
	const localIso = `${dateStr}T${hm}:00`;
	return fromZonedTime(localIso, timeZone);
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ bookingId: string }> },
) {
	try {
		const { bookingId } = await params;
		const rawBody = await request.json();
		const parsed = cancelBodySchema.safeParse(rawBody);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Email inválido", details: parsed.error.flatten() },
				{ status: 400 },
			);
		}
		const { client_email } = parsed.data;

		const { data: booking, error: findError } = await supabase
			.from("bookings")
			.select(
				"id, organization_id, client_name, client_email, date, start_time, price, service_id, professional_id, status",
			)
			.eq("id", bookingId)
			.maybeSingle();

		if (findError || !booking) {
			return NextResponse.json(
				{ error: "Reserva no encontrada" },
				{ status: 404 },
			);
		}

		if (booking.client_email !== client_email) {
			return NextResponse.json(
				{ error: "Email no coincide con la reserva" },
				{ status: 403 },
			);
		}

		const { data: businessConfig } = await supabase
			.from("business_config")
			.select(
				"cancellation_fee_enabled, cancellation_fee_amount, cancellation_fee_hours, timezone, business_name, phone, address, city",
			)
			.eq("organization_id", booking.organization_id)
			.maybeSingle();

		let cancellationFeeApplied = false;
		let cancellationFeeAmount = 0;

		if (businessConfig?.cancellation_fee_enabled) {
			const tz = businessConfig?.timezone || "Europe/Madrid";
			const appointmentDate = appointmentInstantUtc(
				String(booking.date),
				booking.start_time,
				tz,
			);
			const now = new Date();
			const hoursUntil =
				(appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
			const feeHours = businessConfig.cancellation_fee_hours || 24;

			if (hoursUntil < feeHours && hoursUntil > 0) {
				cancellationFeeApplied = true;
				cancellationFeeAmount = businessConfig.cancellation_fee_amount || 0.5;
			}
		}

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
				{ status: 500 },
			);
		}

		try {
			const [{ data: service }, { data: professional }] = await Promise.all([
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
			]);

			await sendCancellationEmail({
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
				timezone: businessConfig?.timezone || "Europe/Madrid",
				cancellationFee: cancellationFeeApplied ? cancellationFeeAmount : undefined,
			});
		} catch (emailError) {
			console.error("❌ Error enviando email de cancelación:", emailError);
		}

		return NextResponse.json({
			success: true,
			message: cancellationFeeApplied
				? `Reserva cancelada. Se aplicó un fee de €${cancellationFeeAmount.toFixed(2)} por cancelación tardía.`
				: "Reserva cancelada",
			cancellationFee: cancellationFeeApplied ? cancellationFeeAmount : null,
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
