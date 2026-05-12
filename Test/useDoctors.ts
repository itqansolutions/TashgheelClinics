import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, usersApi } from '@/api/index';

export const DOCTORS_KEY = 'doctors';

export function useDoctorList(params: { search?: string; page?: number; limit?: number; includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: [DOCTORS_KEY, 'list', params],
    queryFn: async () => {
      const res = await doctorsApi.list(params);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useDoctor(id: number) {
  return useQuery({
    queryKey: [DOCTORS_KEY, id],
    queryFn: async () => {
      const res = await doctorsApi.getById(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: doctorsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOCTORS_KEY] }),
  });
}

export function useUpdateDoctor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof doctorsApi.update>[1]) => doctorsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOCTORS_KEY] }),
  });
}

export function useDeactivateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: doctorsApi.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOCTORS_KEY] }),
  });
}

// Fetch Doctor-role users (for linking when creating a doctor profile)
export function useDoctorUsers() {
  return useQuery({
    queryKey: ['users', 'doctors'],
    queryFn: async () => {
      const res = await usersApi.list({ limit: 100 });
      return (res.data.data ?? []).filter((u) => u.role === 'Doctor');
    },
  });
}
