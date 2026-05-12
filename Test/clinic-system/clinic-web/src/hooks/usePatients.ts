import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '@/api/index';
import { useState } from 'react';

export const PATIENTS_KEY = 'patients';

interface UsePatientListParams {
  search?: string;
  page?: number;
  limit?: number;
  nationality?: string;
  leadSourceId?: number;
}

export function usePatientList(params: UsePatientListParams = {}) {
  return useQuery({
    queryKey: [PATIENTS_KEY, 'list', params],
    queryFn: async () => {
      const res = await patientsApi.list(params);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: [PATIENTS_KEY, id],
    queryFn: async () => {
      const res = await patientsApi.getById(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function usePatientAppointments(id: number) {
  return useQuery({
    queryKey: [PATIENTS_KEY, id, 'appointments'],
    queryFn: async () => {
      const res = await patientsApi.getAppointments(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function usePatientAreas(id: number) {
  return useQuery({
    queryKey: [PATIENTS_KEY, id, 'areas'],
    queryFn: async () => {
      const res = await patientsApi.getAreas(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function usePatientRatings(id: number) {
  return useQuery({
    queryKey: [PATIENTS_KEY, id, 'ratings'],
    queryFn: async () => {
      const res = await patientsApi.getRatings(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function usePatientImages(id: number) {
  return useQuery({
    queryKey: [PATIENTS_KEY, id, 'images'],
    queryFn: async () => {
      const res = await patientsApi.getImages(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patientsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [PATIENTS_KEY] }),
  });
}

export function useUpdatePatient(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof patientsApi.update>[1]) =>
      patientsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY, id] });
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY, 'list'] });
    },
  });
}

export function useDeactivatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patientsApi.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: [PATIENTS_KEY] }),
  });
}

// Pagination helper hook
export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(20);
  return { page, limit, setPage };
}
