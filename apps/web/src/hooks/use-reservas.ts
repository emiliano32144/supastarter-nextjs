import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";

// ═══════════════════════════════════════════════════════════════
// Bookings
// ═══════════════════════════════════════════════════════════════

export function useBookings(
	options?: {
		page?: number;
		limit?: number;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
		search?: string;
		status?: string;
		enabled?: boolean;
	},
) {
	const { enabled = true, ...listInput } = options ?? {};
	return useQuery({
		queryKey: ["reservas", "bookings", listInput],
		queryFn: async () => {
			return await orpcClient.reservas.bookings.list(listInput);
		},
		enabled,
	});
}

export function useCreateBooking() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: Record<string, unknown>) => {
			return await orpcClient.reservas.bookings.create(data as never);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "bookings"] });
		},
	});
}

export function useUpdateBooking() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: { id: string } & Record<string, unknown>) => {
			return await orpcClient.reservas.bookings.update(data as never);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "bookings"] });
		},
	});
}

export function useDeleteBooking() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			return await orpcClient.reservas.bookings.delete({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "bookings"] });
		},
	});
}

// ═══════════════════════════════════════════════════════════════
// Services
// ═══════════════════════════════════════════════════════════════

export function useServices(
	options?: {
		page?: number;
		limit?: number;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
		search?: string;
		enabled?: boolean;
	},
) {
	const { enabled = true, ...listInput } = options ?? {};
	return useQuery({
		queryKey: ["reservas", "services", listInput],
		queryFn: async () => {
			return await orpcClient.reservas.services.list(listInput);
		},
		enabled,
	});
}

export function useCreateService() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: Record<string, unknown>) => {
			return await orpcClient.reservas.services.create(data as never);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "services"] });
		},
	});
}

export function useUpdateService() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: { id: string } & Record<string, unknown>) => {
			return await orpcClient.reservas.services.update(data as never);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "services"] });
		},
	});
}

export function useDeleteService() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			return await orpcClient.reservas.services.delete({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "services"] });
		},
	});
}

// ═══════════════════════════════════════════════════════════════
// Professionals
// ═══════════════════════════════════════════════════════════════

export function useProfessionals(
	options?: {
		page?: number;
		limit?: number;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
		search?: string;
		enabled?: boolean;
	},
) {
	const { enabled = true, ...listInput } = options ?? {};
	return useQuery({
		queryKey: ["reservas", "professionals", listInput],
		queryFn: async () => {
			return await orpcClient.reservas.professionals.list(listInput);
		},
		enabled,
	});
}

export function useCreateProfessional() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: Record<string, unknown>) => {
			return await orpcClient.reservas.professionals.create(data as never);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "professionals"] });
		},
	});
}

export function useUpdateProfessional() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: { id: string } & Record<string, unknown>) => {
			return await orpcClient.reservas.professionals.update(data as never);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "professionals"] });
		},
	});
}

export function useDeleteProfessional() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			return await orpcClient.reservas.professionals.delete({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "professionals"] });
		},
	});
}

// ═══════════════════════════════════════════════════════════════
// Working hours
// ═══════════════════════════════════════════════════════════════

export function useWorkingHours(
	options?: {
		page?: number;
		limit?: number;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
		search?: string;
		enabled?: boolean;
	},
) {
	const { enabled = true, ...listInput } = options ?? {};
	return useQuery({
		queryKey: ["reservas", "working_hours", listInput],
		queryFn: async () => {
			return await orpcClient.reservas.working_hours.list(listInput);
		},
		enabled,
	});
}

export function useCreateWorking_hour() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: Record<string, unknown>) => {
			return await orpcClient.reservas.working_hours.create(data as never);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "working_hours"] });
		},
	});
}

export function useUpdateWorking_hour() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: { id: string } & Record<string, unknown>) => {
			return await orpcClient.reservas.working_hours.update(data as never);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "working_hours"] });
		},
	});
}

// ═══════════════════════════════════════════════════════════════
// Blocked slots (feriados, vacaciones, descansos)
// ═══════════════════════════════════════════════════════════════

export function useBlockedSlots(options?: {
	page?: number;
	limit?: number;
	date_from?: string;
	date_to?: string;
}) {
	return useQuery({
		queryKey: ["reservas", "blocked_slots", options],
		queryFn: async () => {
			return await orpcClient.reservas.blocked_slots.list(options ?? {});
		},
	});
}

export function useCreateBlockedSlot() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			date: string;
			start_time?: string | null;
			end_time?: string | null;
			reason: string;
			professional_id?: string | null;
		}) => {
			return await orpcClient.reservas.blocked_slots.create(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "blocked_slots"] });
		},
	});
}

export function useDeleteBlockedSlot() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			return await orpcClient.reservas.blocked_slots.delete({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reservas", "blocked_slots"] });
		},
	});
}
