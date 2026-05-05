// ═══════════════════════════════════════════════════════════════
// AUTO-SAAS BUILDER - API Procedures
// Blueprint: ReservasPro (reservas)
// Generated: 2025-12-08
// ═══════════════════════════════════════════════════════════════

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
            .eq("organization_id", organizationId);
        
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
            .eq("organization_id", organizationId);
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
        const { error } = await supabase
            .from("bookings")
            .delete()
            .eq("id", input.id)
            .eq("organization_id", organizationId);
        if (error) {
            console.error("Error deleting bookings:", error);
            throw new Error(error.message);
        }
        return { success: true };
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
    .input(z.object({
        professional_id: z.union([z.string().uuid(), z.null()]).optional(),
        day_of_week: z.number().int().min(0).max(6).optional(),
        is_working: z.boolean().optional(),
        open_time: z.string().nullable().optional(),
        close_time: z.string().nullable().optional(),
        break_start: z.string().nullable().optional(),
        break_end: z.string().nullable().optional(),
    }))
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
    .input(z.object({
        id: z.string().uuid(),
        professional_id: z.union([z.string().uuid(), z.null()]).optional(),
        day_of_week: z.number().int().min(0).max(6).optional(),
        is_working: z.boolean().optional(),
        open_time: z.string().nullable().optional(),
        close_time: z.string().nullable().optional(),
        break_start: z.string().nullable().optional(),
        break_end: z.string().nullable().optional(),
    }))
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

