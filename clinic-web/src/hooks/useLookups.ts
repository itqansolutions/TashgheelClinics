import { useQuery } from '@tanstack/react-query';
import { settingsApi, specialtiesApi } from '@/api/index';

export function useLeadSources() {
  return useQuery({
    queryKey: ['lead-sources'],
    queryFn: async () => {
      const res = await settingsApi.getLeadSources();
      return res.data.data;
    },
    staleTime: Infinity,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await settingsApi.getCountries();
      return res.data.data;
    },
    staleTime: Infinity,
  });
}

export function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const res = await specialtiesApi.list(false);
      return res.data.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useBodyAreas(zone?: 'front' | 'back') {
  return useQuery({
    queryKey: ['body-areas', zone],
    queryFn: async () => {
      const res = await settingsApi.getBodyAreas(zone);
      return res.data.data;
    },
    staleTime: Infinity,
  });
}
