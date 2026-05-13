import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
	sendBookingPendingConfirmationEmail,
	sendBusinessNotificationEmail,
} from "../../../../../../lib/email/booking-emails";
import {
	getClientIpForRateLimit,
	isRateLimited,
} from "../../../../../../lib/rate-limit-memory";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const bookBodySchema = z.object({
	service_id: z.string().uuid(),
	professional_id: z.string().uuid().nullable().optional(),
	client_name: z.string().min(1).max(200),
	client_email: z.string().email().max(320),
	client_phone: z.string().min(3).max(40),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	start_time: z.string().min(4).max(12),
	notes: z.string().max(5000).nullable().optional(),
	client_profile_id: z.string().uuid().nullable().optional(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const ip = getClientIpForRateLimit(request);
		if (isRateLimited(`book:${ip}:${slug}`, 30, 60_000)) {
			return NextResponse.json(
				{ error: "Demasiados intentos de reserva. Probá en un minuto." },
				{ status: 429 },
			);
		}

		const rawBody = await request.json();
		const parsed = bookBodySchema.safeParse(rawBody);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Datos inválidos", details: parsed.error.flatten() },
				{ status: 400 },
			);
		}

		const {
			service_id,
			professional_id,
			client_name,
			client_email,
			client_phone,
			date,
			start_time,
			notes,
			client_profile_id,
		} = parsed.data;

		const timeNorm = start_time.trim().slice(0, 5);
		if (!/^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeNorm)) {
			return NextResponse.json(
				{ error: "Formato de hora inválido (usar HH:MM)" },
				{ status: 400 },
			);
		}

		let businessConfig: Record<string, unknown> | null = null;
		let organizationId = slug;

		const { data: configBySlug } = await supabase
			.from("business_config")
			.select("*")
			.eq("slug", slug)
			.maybeSingle();

		if (configBySlug) {
			businessConfig = configBySlug as Record<string, unknown>;
			organizationId = String(configBySlug.organization_id);
		} else {
			const { data: configById } = await supabase
				.from("business_config")
				.select("*")
				.eq("organization_id", slug)
				.maybeSingle();

			if (configById) {
				businessConfig = configById as Record<string, unknown>;
				organizationId = String(configById.organization_id);
			}
		}

		if (!businessConfig) {
			return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
		}

		const plan = businessConfig.plan as string | undefined;
		const trialEndsAt = businessConfig.trial_ends_at as string | null | undefined;
		if (plan === "trial" && trialEndsAt) {
			const trialEnd = new Date(trialEndsAt);
			if (Number.isFinite(trialEnd.getTime()) && trialEnd.getTime() < Date.now()) {
				return NextResponse.json(
					{
						error:
							"El período de prueba de este salón finalizó. No se pueden crear nuevas reservas hasta que activen un plan.",
					},
					{ status: 403 },
				);
			}
		}

		const { data: service, error: serviceError } = await supabase
			.from("services")
			.select("id, name, duration, price")
			.eq("id", service_id)
			.eq("organization_id", organizationId)
			.maybeSingle();

		if (serviceError || !service) {
			return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
		}

		const [hours, minutes] = timeNorm.split(":").map(Number);
		const startDate = new Date();
		startDate.setHours(hours, minutes, 0, 0);
		const endDate = new Date(startDate.getTime() + service.duration * 60000);
		const end_time = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

		await supabase
			.from("bookings")
			.update({ status: "cancelled" })
			.eq("organization_id", organizationId)
			.eq("status", "awaiting_confirmation")
			.lt("confirmation_expires_at", new Date().toISOString());

		let bookingQuery = supabase
			.from("bookings")
			.select("id")
			.eq("organization_id", organizationId)
			.eq("date", date)
			.neq("status", "cancelled")
			.or(
				`and(start_time.lte.${timeNorm},end_time.gt.${timeNorm}),and(start_time.lt.${end_time},end_time.gte.${end_time})`,
			);

		if (professional_id) {
			bookingQuery = bookingQuery.eq("professional_id", professional_id);
		} else {
			bookingQuery = bookingQuery.is("professional_id", null);
		}

		const { data: existingBookings, error: checkError } = await bookingQuery;

		if (checkError) {
			console.error("Error checking availability:", checkError);
			return NextResponse.json(
				{ error: "Error al verificar disponibilidad" },
				{ status: 500 },
			);
		}

		if (existingBookings && existingBookings.length > 0) {
			return NextResponse.json(
				{ error: "Este horario ya no está disponible" },
				{ status: 409 },
			);
		}

		let client_id: string | null = null;
		const { data: existingClient } = await supabase
			.from("clients")
			.select("id")
			.eq("organization_id", organizationId)
			.eq("email", client_email)
			.maybeSingle();

		if (existingClient) {
			client_id = existingClient.id;
			await supabase
				.from("clients")
				.update({
					last_visit: new Date().toISOString(),
				})
				.eq("id", client_id);
		} else {
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
				.maybeSingle();

			if (clientError) {
				console.error("Error creating client:", clientError);
			}
			if (newClient) {
				client_id = newClient.id;
			}
		}

		const { data: booking, error: bookingError } = await supabase
			.from("bookings")
			.insert({
				organization_id: organizationId,
				client_id,
				client_profile_id: client_profile_id ?? null,
				professional_id: professional_id ?? null,
				service_id,
				client_name,
				client_email,
				client_phone,
				date,
				start_time: timeNorm,
				end_time,
				status: "awaiting_confirmation",
				confirmation_token: crypto.randomUUID(),
				confirmation_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
				notes: notes ?? null,
				price: service.price,
			})
			.select()
			.maybeSingle();

		if (bookingError || !booking) {
			console.error("Error creating booking:", bookingError);
			return NextResponse.json(
				{ error: "Error al crear la reserva" },
				{ status: 500 },
			);
		}

		let professional: { name: string } | null = null;
		if (professional_id) {
			const { data: profData } = await supabase
				.from("professionals")
				.select("name")
				.eq("id", professional_id)
				.maybeSingle();
			if (profData) {
				professional = profData;
			}
		}

		const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/public/booking/${booking.id}/confirm?token=${booking.confirmation_token}`;

		try {
			await sendBookingPendingConfirmationEmail({
				clientName: client_name,
				clientEmail: client_email,
				serviceName: service?.name || "Servicio",
				professionalName: professional?.name || null,
				date,
				time: timeNorm,
				price: service?.price || 0,
				businessName: String(businessConfig.business_name || "Barbería"),
				businessPhone: (businessConfig.phone as string | undefined) || undefined,
				businessAddress: businessConfig.address
					? `${businessConfig.address}${businessConfig.city ? `, ${businessConfig.city}` : ""}`
					: undefined,
				confirmUrl,
				timezone: String(businessConfig.timezone || "Europe/Madrid"),
			});
		} catch (emailError) {
			console.error("❌ Error enviando email de confirmación pendiente:", emailError);
		}

		const bizEmail = businessConfig.email as string | undefined;
		if (bizEmail) {
			try {
				await sendBusinessNotificationEmail({
					clientName: client_name,
					clientEmail: client_email,
					serviceName: service?.name || "Servicio",
					professionalName: professional?.name || null,
					date,
					time: timeNorm,
					price: service?.price || 0,
					businessName: String(businessConfig.business_name || "Barbería"),
					businessPhone: (businessConfig.phone as string | undefined) || undefined,
					businessAddress: businessConfig.address
						? `${businessConfig.address}${businessConfig.city ? `, ${businessConfig.city}` : ""}`
						: undefined,
					businessEmail: bizEmail,
					timezone: String(businessConfig.timezone || "Europe/Madrid"),
				});
			} catch (notifyError) {
				console.error("❌ Error notificación peluquero:", notifyError);
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
			message: "Revisá tu email para confirmar la reserva",
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Error";
		console.error("Error creating booking:", error);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
