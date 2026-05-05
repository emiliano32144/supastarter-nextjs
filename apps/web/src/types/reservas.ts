// ═══════════════════════════════════════════════════════════════
// AUTO-SAAS BUILDER - TypeScript Types
// Blueprint: ReservasPro (reservas)
// Generated: 2025-12-08T12:08:05.229Z
// ═══════════════════════════════════════════════════════════════

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// Bookings
// ═══════════════════════════════════════════════════════════════

export interface Bookings {
  id: string;
  organization_id: string;
  client_id: string | null;
  professional_id: string | null;
  service_id: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  date: Date;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  price: number | null;
  created_at: Date;
  updated_at: Date;
}

export const BookingsSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  client_id: z.string().nullable(),
  professional_id: z.string().nullable(),
  service_id: z.string().nullable(),
  client_name: z.string(),
  client_email: z.string().nullable(),
  client_phone: z.string().nullable(),
  date: z.coerce.date(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  price: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const NewBookingsSchema = BookingsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// ═══════════════════════════════════════════════════════════════
// Services
// ═══════════════════════════════════════════════════════════════

export interface Services {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  is_active: boolean;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export const ServicesSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  duration: z.number(),
  price: z.number(),
  is_active: z.boolean(),
  color: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const NewServicesSchema = ServicesSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// ═══════════════════════════════════════════════════════════════
// Professionals
// ═══════════════════════════════════════════════════════════════

export interface Professionals {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  specialties: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const ProfessionalsSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
  specialties: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const NewProfessionalsSchema = ProfessionalsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// ═══════════════════════════════════════════════════════════════
// WorkingHours
// ═══════════════════════════════════════════════════════════════

export interface WorkingHours {
  id: string;
  organization_id: string;
  professional_id: string | null;
  day_of_week: number;
  is_working: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
  created_at: Date | string;
  updated_at?: Date | string | null;
}

export const WorkingHoursSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  professional_id: z.string().nullable(),
  day_of_week: z.number(),
  is_working: z.boolean(),
  open_time: z.string().nullable(),
  close_time: z.string().nullable(),
  break_start: z.string().nullable(),
  break_end: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable().optional(),
});

export const NewWorkingHoursSchema = WorkingHoursSchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
});

// ═══════════════════════════════════════════════════════════════
// Clients
// ═══════════════════════════════════════════════════════════════

export interface Clients {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  total_visits: number;
  last_visit: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const ClientsSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  total_visits: z.number(),
  last_visit: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const NewClientsSchema = ClientsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

