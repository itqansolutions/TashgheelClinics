import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments';

export const APPOINTMENTS_KEY = ['appointments'];

export function useAppointments(filters?: any) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, filters],
    queryFn: () => appointmentsApi.getAll(filters),
  });
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, id],
    queryFn: () => appointmentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => appointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
    },
  });
}

export function useDoctorAppointments(filters?: any) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, 'doctor-me', filters],
    queryFn: () => appointmentsApi.getDoctorMe(filters),
  });
}
