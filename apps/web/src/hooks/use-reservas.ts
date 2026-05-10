
// ═══════════════════════════════════════════════════════════════
// Blocked Slots Hooks (feriados, vacaciones, descansos)
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
      const result = await orpcClient.reservas.blocked_slots.list(options);
      return result;
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
