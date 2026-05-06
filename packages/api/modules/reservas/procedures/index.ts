// ═══════════════════════════════════════════════════════════════
// AUTO-SAAS BUILDER - API Procedures
// Blueprint: ReservasPro (reservas)
// Generated: 2025-12-08
// ═══════════════════════════════════════════════════════════════

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { createClient } from "@supabase/supabase-js";
import {
	sendBookingCancellationEmail,
	sendBookingCompletedEmail,
} from "../../../../../apps/web/lib/email/booking-emails";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function bookingTimeLabel(value: unknown): string {
	if (value == null || value === "") {
		return "";
	}
	const s = String(value);
	return s.length >= 5 ? s.slice(0, 5) : s;
}

// ═══════════════════════════════════════════════════════════════
// BOOKINGS CRUD
// ═══════════════════════════════════════════════════════════════

export const listBookings = protectedProcedure
    .route({ method: "GET", path: "/reservas/bookings" })
    .input(z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('created_at'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().optional(),
        status: z.string().optional(),
    }).optional())
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', search, status } = input || {};
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from("bookings")
            .select("*", { count: 'exact' })
            .eq("organization_id", organizationId)
            .neq("status", "cancelled");
        
        // Apply search filter
        if (search) {
            query = query.or(`client_name.ilike.%${search}%,client_email.ilike.%${search}%,client_phone.ilike.%${search}%,status.ilike.%${search}%,notes.ilike.%${search}%`);
        }
        
        // Apply status filter
        if (status) {
            query = query.eq("status", status);
        }
        
        // Get total count with filters
        const countQuery = supabase
            .from("bookings")
            .select("*", { count: 'exact', head: true })
            .eq("organization_id", organizationId)
            .neq("status", "cancelled");
        if (search) {
            countQuery.or(`client_name.ilike.%${search}%,client_email.ilike.%${search}%,client_phone.ilike.%${search}%,status.ilike.%${search}%,notes.ilike.%${search}%`);
        }
        if (status) {
            countQuery.eq("status", status);
        }
        const { count } = await countQuery;
        
        // Get paginated data
        const { data, error } = await query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        
        if (error) {
            console.error("Error fetching bookings:", error);
            throw new Error(error.message);
        }
        
        return {
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    });

export const getBookings = protectedProcedure
    .route({ method: "GET", path: "/reservas/bookings/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", input.id)
            .eq("organization_id", organizationId)
            .single();
        if (error) {
            console.error("Error fetching bookings:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const createBookings = protectedProcedure
    .route({ method: "POST", path: "/reservas/bookings" })
    .input(z.object({
        client_id: z.string().uuid().optional(),
        professional_id: z.string().uuid().optional(),
        service_id: z.string().uuid().optional(),
        client_name: z.string().min(1),
        client_email: z.string().email().nullable().optional(),
        client_phone: z.string().nullable().optional(),
        date: z.string().optional(),
        status: z.string().min(1),
        notes: z.string().nullable().optional(),
        price: z.number().optional(),
    }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("bookings")
            .insert({ ...input, organization_id: organizationId })
            .select()
            .single();
        if (error) {
            console.error("Error creating bookings:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const updateBookings = protectedProcedure
    .route({ method: "PUT", path: "/reservas/bookings/:id" })
    .input(z.object({
        id: z.string().uuid(),
        client_id: z.string().uuid().optional(),
        professional_id: z.string().uuid().optional(),
        service_id: z.string().uuid().optional(),
        client_name: z.string().nullable().optional(),
        client_email: z.string().email().nullable().optional(),
        client_phone: z.string().nullable().optional(),
        date: z.string().optional(),
        status: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        price: z.number().optional(),
    }))
    .handler(async ({ input, context }) => {
        const { id, ...updateData } = input;
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("bookings")
            .update(updateData)
            .eq("id", id)
            .eq("organization_id", organizationId)
            .select()
            .single();
        if (error) {
            console.error("Error updating bookings:", error);
            throw new Error(error.message);
        }

        const row = data;

        function attachCompletedEmailXpFields(
            r: Record<string, unknown>,
            fields: {
                total_xp: number;
                xp_earned: number;
                level_up: boolean;
                new_level_name: string | null;
            },
        ) {
            r.total_xp = fields.total_xp;
            r.xp_earned = fields.xp_earned;
            r.level_up = fields.level_up;
            r.new_level_name = fields.new_level_name;
        }

        // ═══════════════════════════════════════════════════════════════
        // FLUJO ESPECIAL: status === "completed"
        // Sumar XP, actualizar nivel, crear recompensa, registrar historial
        // ═══════════════════════════════════════════════════════════════
        const bookingRowFk = row as {
            client_profile_id?: string | null;
            client_id?: string | null;
        };
        const profileFkForXp =
            bookingRowFk.client_profile_id ?? bookingRowFk.client_id;

        if (updateData.status === "completed" && profileFkForXp) {
            try {
                let xpValue = 100;
                let serviceName = "Servicio";
                if (row.service_id) {
                    const { data: service } = await supabase
                        .from("services")
                        .select("xp_value, name, price")
                        .eq("id", row.service_id)
                        .maybeSingle();
                    if (service?.xp_value) {
                        xpValue = service.xp_value;
                    }
                    if (service?.name) {
                        serviceName = service.name;
                    }
                }

                const { data: profile } = await supabase
                    .from("client_profiles")
                    .select("*")
                    .eq("organization_id", organizationId)
                    .eq("id", profileFkForXp)
                    .maybeSingle();

                if (profile) {
                    const newTotalXp = (profile.total_xp || 0) + xpValue;
                    const newTotalVisits = (profile.total_visits || 0) + 1;
                    const priceNum =
                        typeof row.price === "number"
                            ? row.price
                            : parseFloat(String(row.price ?? 0));
                    const newTotalSpent =
                        parseFloat(String(profile.total_spent ?? "0")) + priceNum;

                    const { data: levels } = await supabase
                        .from("loyalty_levels")
                        .select("*")
                        .eq("organization_id", organizationId)
                        .order("min_xp", { ascending: false });

                    let currentLevel = profile.current_level || 1;
                    let levelName = profile.level_name || "Bronce";
                    let levelUp = false;
                    let newLevel: { id: string; level_number: number; name: string; reward_type: string | null; reward_value: number | string | null; reward_description: string | null } | null =
                        null;

                    if (levels && levels.length > 0) {
                        for (const level of levels) {
                            if (newTotalXp >= level.min_xp) {
                                if (level.level_number > currentLevel) {
                                    levelUp = true;
                                    newLevel = level;
                                    if (level.reward_type && level.reward_type !== "none") {
                                        await supabase.from("earned_rewards").insert({
                                            organization_id: organizationId,
                                            client_profile_id: profile.id,
                                            loyalty_level_id: level.id,
                                            reward_type: level.reward_type,
                                            reward_value: level.reward_value,
                                            reward_description: level.reward_description,
                                            status: "available",
                                            expires_at: new Date(
                                                Date.now() + 90 * 24 * 60 * 60 * 1000,
                                            ).toISOString(),
                                        });
                                    }
                                }
                                currentLevel = level.level_number;
                                levelName = level.name;
                                break;
                            }
                        }
                    }

                    await supabase
                        .from("client_profiles")
                        .update({
                            total_xp: newTotalXp,
                            total_visits: newTotalVisits,
                            total_spent: newTotalSpent.toString(),
                            current_level: currentLevel,
                            level_name: levelName,
                            last_visit: new Date().toISOString(),
                        })
                        .eq("id", profile.id);

                    // Guard contra doble XP
                    const { data: existingXp } = await supabase
                        .from("xp_history")
                        .select("id")
                        .eq("booking_id", row.id)
                        .maybeSingle();

                    if (!existingXp) {
                        await supabase.from("xp_history").insert({
                            organization_id: organizationId,
                            client_profile_id: profile.id,
                            xp_amount: xpValue,
                            reason: `Servicio completado: ${serviceName}`,
                            booking_id: row.id,
                        });
                    }

                    attachCompletedEmailXpFields(row as unknown as Record<string, unknown>, {
                        total_xp: newTotalXp,
                        xp_earned: xpValue,
                        level_up: levelUp,
                        new_level_name: newLevel?.name ?? null,
                    });
                }
            } catch (xpError) {
                console.error("Error procesando XP en updateBookings:", xpError);
                // No fallar la reserva si el XP falla
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // EMAILS POR STATUS
        // ═══════════════════════════════════════════════════════════════

        if (updateData.status === "cancelled" && row?.client_email) {
            try {
                let service: { name: string } | null = null;
                if (row.service_id) {
                    const s = await supabase
                        .from("services")
                        .select("name")
                        .eq("id", row.service_id)
                        .maybeSingle();
                    service = s.data ?? null;
                }

                let professional: { name: string } | null = null;
                if (row.professional_id) {
                    const p = await supabase
                        .from("professionals")
                        .select("name")
                        .eq("id", row.professional_id)
                        .maybeSingle();
                    professional = p.data ?? null;
                }

                const { data: businessConfig } = await supabase
                    .from("business_config")
                    .select("business_name, phone, address, city")
                    .eq("organization_id", organizationId)
                    .maybeSingle();

                await sendBookingCancellationEmail({
                    clientName: row.client_name,
                    clientEmail: row.client_email,
                    serviceName: service?.name ?? "Servicio",
                    professionalName: professional?.name ?? null,
                    date: row.date,
                    time: bookingTimeLabel(row.start_time),
                    price: Number(row.price) || 0,
                    businessName: businessConfig?.business_name ?? "Barbería",
                    businessPhone: businessConfig?.phone ?? undefined,
                    businessAddress: businessConfig?.address
                        ? `${businessConfig.address}${businessConfig.city ? `, ${businessConfig.city}` : ""}`
                        : undefined,
                });
            } catch (emailError) {
                console.error("Error sending cancellation email:", emailError);
            }
        }

        if (updateData.status === "completed" && row?.client_email) {
            try {
                let service: { name: string } | null = null;
                if (row.service_id) {
                    const s = await supabase
                        .from("services")
                        .select("name")
                        .eq("id", row.service_id)
                        .maybeSingle();
                    service = s.data ?? null;
                }

                let professional: { name: string } | null = null;
                if (row.professional_id) {
                    const p = await supabase
                        .from("professionals")
                        .select("name")
                        .eq("id", row.professional_id)
                        .maybeSingle();
                    professional = p.data ?? null;
                }

                const { data: businessConfig } = await supabase
                    .from("business_config")
                    .select("business_name, phone, address, city")
                    .eq("organization_id", organizationId)
                    .maybeSingle();

                const r = row as unknown as Record<string, unknown>;
                const totalXp =
                    typeof r.total_xp === "number" ? r.total_xp : Number(r.total_xp) || 0;
                const xpEarned =
                    typeof r.xp_earned === "number"
                        ? r.xp_earned
                        : Number(r.xp_earned) || 0;
                const levelUp = Boolean(r.level_up);
                const newLevelName =
                    typeof r.new_level_name === "string" ? r.new_level_name : null;

                await sendBookingCompletedEmail({
                    clientName: row.client_name,
                    clientEmail: row.client_email,
                    serviceName: service?.name ?? "Servicio",
                    professionalName: professional?.name ?? null,
                    date: row.date,
                    time: bookingTimeLabel(row.start_time),
                    price: Number(row.price) || 0,
                    businessName: businessConfig?.business_name ?? "Barbería",
                    xpEarned,
                    totalXp,
                    nextLevel: levelUp ? newLevelName ?? undefined : undefined,
                    nextReward: levelUp && newLevelName
                        ? `¡Subiste a ${newLevelName}!`
                        : undefined,
                });
            } catch (emailError) {
                console.error("Error sending completed email:", emailError);
            }
        }

        return { data };
    });

export const deleteBookings = protectedProcedure
    .route({ method: "DELETE", path: "/reservas/bookings/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }

        // 1. Obtener datos del booking ANTES de cambiar el estado (para emails)
        const { data: booking, error: fetchError } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", input.id)
            .eq("organization_id", organizationId)
            .single();

        if (fetchError || !booking) {
            console.error("Error fetching booking for cancellation:", fetchError);
            throw new Error("Reserva no encontrada");
        }

        // 2. Soft delete: cambiar status a 'cancelled'
        const { error } = await supabase
            .from("bookings")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", input.id)
            .eq("organization_id", organizationId);

        if (error) {
            console.error("Error cancelling booking:", error);
            throw new Error(error.message);
        }

        // 3. Enviar email de cancelación al cliente
        try {
            const { sendBookingCancellationEmail } = await import("../../../../../apps/web/lib/email/booking-emails");
            if (booking.client_email) {
                await sendBookingCancellationEmail({
                    clientName: booking.client_name,
                    clientEmail: booking.client_email,
                    serviceName: "Servicio", // fallback
                    professionalName: null,
                    date: booking.date,
                    time: booking.start_time,
                    price: booking.price || 0,
                    businessName: "Tu Barbería", // fallback, se obtiene mejor abajo
                });
            }
        } catch (emailError) {
            console.error("Error sending cancellation email to client:", emailError);
        }

        // 4. Enviar email al peluquero (si tiene email configurado)
        try {
            const { data: businessConfig } = await supabase
                .from("business_config")
                .select("business_name, email")
                .eq("organization_id", organizationId)
                .single();

            if (businessConfig?.email && booking.client_email) {
                const { sendBookingNotificationEmail } = await import("../../../../../apps/web/lib/email/booking-emails");
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
        } catch (notifyError) {
            console.error("Error sending cancellation notification to business:", notifyError);
        }

        return { success: true, booking };
    });

// ═══════════════════════════════════════════════════════════════
// SERVICES CRUD
// ═══════════════════════════════════════════════════════════════

export const listServices = protectedProcedure
    .route({ method: "GET", path: "/reservas/services" })
    .input(z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('created_at'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().optional(),
    }).optional())
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', search } = input || {};
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from("services")
            .select("*", { count: 'exact' })
            .eq("organization_id", organizationId);
        
        // Apply search filter
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,color.ilike.%${search}%`);
        }
        
        // Get total count with filters
        const countQuery = supabase
            .from("services")
            .select("*", { count: 'exact', head: true })
            .eq("organization_id", organizationId);
        if (search) {
            countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,color.ilike.%${search}%`);
        }
        const { count } = await countQuery;
        
        // Get paginated data
        const { data, error } = await query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        
        if (error) {
            console.error("Error fetching services:", error);
            throw new Error(error.message);
        }
        
        return {
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    });

export const getServices = protectedProcedure
    .route({ method: "GET", path: "/reservas/services/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("services")
            .select("*")
            .eq("id", input.id)
            .eq("organization_id", organizationId)
            .single();
        if (error) {
            console.error("Error fetching services:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const createServices = protectedProcedure
    .route({ method: "POST", path: "/reservas/services" })
    .input(z.object({
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        duration: z.number().int().optional(),
        price: z.number().optional(),
        is_active: z.boolean().optional(),
        color: z.string().nullable().optional(),
    }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("services")
            .insert({ ...input, organization_id: organizationId })
            .select()
            .single();
        if (error) {
            console.error("Error creating services:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const updateServices = protectedProcedure
    .route({ method: "PUT", path: "/reservas/services/:id" })
    .input(z.object({
        id: z.string().uuid(),
        name: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        duration: z.number().int().optional(),
        price: z.number().optional(),
        is_active: z.boolean().optional(),
        color: z.string().nullable().optional(),
    }))
    .handler(async ({ input, context }) => {
        const { id, ...updateData } = input;
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("services")
            .update(updateData)
            .eq("id", id)
            .eq("organization_id", organizationId)
            .select()
            .single();
        if (error) {
            console.error("Error updating services:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const deleteServices = protectedProcedure
    .route({ method: "DELETE", path: "/reservas/services/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { error } = await supabase
            .from("services")
            .delete()
            .eq("id", input.id)
            .eq("organization_id", organizationId);
        if (error) {
            console.error("Error deleting services:", error);
            throw new Error(error.message);
        }
        return { success: true };
    });

// ═══════════════════════════════════════════════════════════════
// PROFESSIONALS CRUD
// ═══════════════════════════════════════════════════════════════

export const listProfessionals = protectedProcedure
    .route({ method: "GET", path: "/reservas/professionals" })
    .input(z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('created_at'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().optional(),
    }).optional())
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', search } = input || {};
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from("professionals")
            .select("*", { count: 'exact' })
            .eq("organization_id", organizationId);
        
        // Apply search filter
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,avatar_url.ilike.%${search}%,specialties.ilike.%${search}%`);
        }
        
        // Get total count with filters
        const countQuery = supabase
            .from("professionals")
            .select("*", { count: 'exact', head: true })
            .eq("organization_id", organizationId);
        if (search) {
            countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,avatar_url.ilike.%${search}%,specialties.ilike.%${search}%`);
        }
        const { count } = await countQuery;
        
        // Get paginated data
        const { data, error } = await query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        
        if (error) {
            console.error("Error fetching professionals:", error);
            throw new Error(error.message);
        }
        
        return {
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    });

export const getProfessionals = protectedProcedure
    .route({ method: "GET", path: "/reservas/professionals/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("professionals")
            .select("*")
            .eq("id", input.id)
            .eq("organization_id", organizationId)
            .single();
        if (error) {
            console.error("Error fetching professionals:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const createProfessionals = protectedProcedure
    .route({ method: "POST", path: "/reservas/professionals" })
    .input(z.object({
        name: z.string().min(1),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        avatar_url: z.string().nullable().optional(),
        specialties: z.string().nullable().optional(),
        is_active: z.boolean().optional(),
    }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("professionals")
            .insert({
                id: randomUUID(),
                ...input,
                organization_id: organizationId,
            })
            .select()
            .single();
        if (error) {
            console.error("Error creating professionals:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const updateProfessionals = protectedProcedure
    .route({ method: "PUT", path: "/reservas/professionals/:id" })
    .input(z.object({
        id: z.string().uuid(),
        name: z.string().nullable().optional(),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        avatar_url: z.string().nullable().optional(),
        specialties: z.string().nullable().optional(),
        is_active: z.boolean().optional(),
    }))
    .handler(async ({ input, context }) => {
        const { id, ...updateData } = input;
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("professionals")
            .update(updateData)
            .eq("id", id)
            .eq("organization_id", organizationId)
            .select()
            .single();
        if (error) {
            console.error("Error updating professionals:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const deleteProfessionals = protectedProcedure
    .route({ method: "DELETE", path: "/reservas/professionals/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { error } = await supabase
            .from("professionals")
            .delete()
            .eq("id", input.id)
            .eq("organization_id", organizationId);
        if (error) {
            console.error("Error deleting professionals:", error);
            throw new Error(error.message);
        }
        return { success: true };
    });

// ═══════════════════════════════════════════════════════════════
// WORKINGHOURS CRUD
// ═══════════════════════════════════════════════════════════════

export const listWorkingHours = protectedProcedure
    .route({ method: "GET", path: "/reservas/working_hours" })
    .input(z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('created_at'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().optional(),
    }).optional())
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', search } = input || {};
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from("working_hours")
            .select("*", { count: 'exact' })
            .eq("organization_id", organizationId);
        
        // Apply search filter
        if (search) {
        }
        
        // Get total count with filters
        const countQuery = supabase
            .from("working_hours")
            .select("*", { count: 'exact', head: true })
            .eq("organization_id", organizationId);
        if (search) {
        }
        const { count } = await countQuery;
        
        // Get paginated data
        const { data, error } = await query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        
        if (error) {
            console.error("Error fetching working_hours:", error);
            throw new Error(error.message);
        }
        
        return {
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    });

export const getWorkingHours = protectedProcedure
    .route({ method: "GET", path: "/reservas/working_hours/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("working_hours")
            .select("*")
            .eq("id", input.id)
            .eq("organization_id", organizationId)
            .single();
        if (error) {
            console.error("Error fetching working_hours:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const createWorkingHours = protectedProcedure
    .route({ method: "POST", path: "/reservas/working_hours" })
    .input(
        z.object({
            professional_id: z.union([z.string().uuid(), z.null()]).optional(),
            day_of_week: z.number().int().min(0).max(6),
            is_working: z.boolean().optional(),
            open_time: z.string().nullable().optional(),
            close_time: z.string().nullable().optional(),
            break_start: z.string().nullable().optional(),
            break_end: z.string().nullable().optional(),
        }),
    )
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("working_hours")
            .insert({
                id: randomUUID(),
                ...input,
                organization_id: organizationId,
            })
            .select()
            .single();
        if (error) {
            console.error("Error creating working_hours:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const updateWorkingHours = protectedProcedure
    .route({ method: "PUT", path: "/reservas/working_hours/:id" })
    .input(
        z.object({
            id: z.string().uuid(),
            professional_id: z.union([z.string().uuid(), z.null()]).optional(),
            day_of_week: z.number().int().min(0).max(6).optional(),
            is_working: z.boolean().optional(),
            open_time: z.string().nullable().optional(),
            close_time: z.string().nullable().optional(),
            break_start: z.string().nullable().optional(),
            break_end: z.string().nullable().optional(),
        }),
    )
    .handler(async ({ input, context }) => {
        const { id, ...updateData } = input;
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("working_hours")
            .update(updateData)
            .eq("id", id)
            .eq("organization_id", organizationId)
            .select()
            .single();
        if (error) {
            console.error("Error updating working_hours:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const deleteWorkingHours = protectedProcedure
    .route({ method: "DELETE", path: "/reservas/working_hours/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { error } = await supabase
            .from("working_hours")
            .delete()
            .eq("id", input.id)
            .eq("organization_id", organizationId);
        if (error) {
            console.error("Error deleting working_hours:", error);
            throw new Error(error.message);
        }
        return { success: true };
    });

// ═══════════════════════════════════════════════════════════════
// CLIENTS CRUD
// ═══════════════════════════════════════════════════════════════

export const listClients = protectedProcedure
    .route({ method: "GET", path: "/reservas/clients" })
    .input(z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('created_at'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().optional(),
    }).optional())
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', search } = input || {};
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from("clients")
            .select("*", { count: 'exact' })
            .eq("organization_id", organizationId);
        
        // Apply search filter
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,notes.ilike.%${search}%`);
        }
        
        // Get total count with filters
        const countQuery = supabase
            .from("clients")
            .select("*", { count: 'exact', head: true })
            .eq("organization_id", organizationId);
        if (search) {
            countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,notes.ilike.%${search}%`);
        }
        const { count } = await countQuery;
        
        // Get paginated data
        const { data, error } = await query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        
        if (error) {
            console.error("Error fetching clients:", error);
            throw new Error(error.message);
        }
        
        return {
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    });

export const getClients = protectedProcedure
    .route({ method: "GET", path: "/reservas/clients/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("clients")
            .select("*")
            .eq("id", input.id)
            .eq("organization_id", organizationId)
            .single();
        if (error) {
            console.error("Error fetching clients:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const createClients = protectedProcedure
    .route({ method: "POST", path: "/reservas/clients" })
    .input(z.object({
        name: z.string().min(1),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        total_visits: z.number().int().optional(),
    }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("clients")
            .insert({
                id: randomUUID(),
                ...input,
                organization_id: organizationId,
            })
            .select()
            .single();
        if (error) {
            console.error("Error creating clients:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const updateClients = protectedProcedure
    .route({ method: "PUT", path: "/reservas/clients/:id" })
    .input(z.object({
        id: z.string().uuid(),
        name: z.string().nullable().optional(),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        total_visits: z.number().int().optional(),
    }))
    .handler(async ({ input, context }) => {
        const { id, ...updateData } = input;
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { data, error } = await supabase
            .from("clients")
            .update(updateData)
            .eq("id", id)
            .eq("organization_id", organizationId)
            .select()
            .single();
        if (error) {
            console.error("Error updating clients:", error);
            throw new Error(error.message);
        }
        return { data };
    });

export const deleteClients = protectedProcedure
    .route({ method: "DELETE", path: "/reservas/clients/:id" })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
        const organizationId = context.session?.activeOrganizationId;
        if (!organizationId) {
            throw new Error("No active organization");
        }
        const { error } = await supabase
            .from("clients")
            .delete()
            .eq("id", input.id)
            .eq("organization_id", organizationId);
        if (error) {
            console.error("Error deleting clients:", error);
            throw new Error(error.message);
        }
        return { success: true };
    });

