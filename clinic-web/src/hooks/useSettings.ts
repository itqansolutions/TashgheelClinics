import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/index';

export const SETTINGS_KEY = 'settings';

export function useClinicSettings() {
  return useQuery({
    queryKey: [SETTINGS_KEY, 'clinic'],
    queryFn: async () => {
      const res = await settingsApi.getClinic();
      return res.data.data as Record<string, string>;
    },
  });
}

export function useUpdateClinicSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, string>) =>
      settingsApi.updateClinicBulk(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SETTINGS_KEY, 'clinic'] }),
  });
}

export function useLeadSourcesAdmin() {
  return useQuery({
    queryKey: [SETTINGS_KEY, 'lead-sources'],
    queryFn: async () => {
      const res = await settingsApi.getLeadSources();
      return res.data.data;
    },
  });
}

export function useLeadSourceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [SETTINGS_KEY, 'lead-sources'] });

  const create = useMutation({ mutationFn: (name: string) => settingsApi.createLeadSource(name), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => settingsApi.updateLeadSource(id, name),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: number) => settingsApi.deleteLeadSource(id), onSuccess: invalidate });

  return { create, update, remove };
}
