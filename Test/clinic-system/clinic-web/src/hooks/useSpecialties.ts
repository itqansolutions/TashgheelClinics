import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { specialtiesApi, servicesApi } from '@/api/index';

export const SPECIALTIES_KEY = 'specialties';

export function useSpecialtyList(includeInactive = false) {
  return useQuery({
    queryKey: [SPECIALTIES_KEY, 'list', includeInactive],
    queryFn: async () => {
      const res = await specialtiesApi.list(includeInactive);
      return res.data.data ?? [];
    },
  });
}

export function useCreateSpecialty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => specialtiesApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SPECIALTIES_KEY] }),
  });
}

export function useUpdateSpecialty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; isActive?: boolean } }) =>
      specialtiesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SPECIALTIES_KEY] }),
  });
}

export function useDeactivateSpecialty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: specialtiesApi.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: [SPECIALTIES_KEY] }),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [SPECIALTIES_KEY] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof servicesApi.update>[1] }) =>
      servicesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SPECIALTIES_KEY] }),
  });
}

export function useDeactivateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: servicesApi.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: [SPECIALTIES_KEY] }),
  });
}
