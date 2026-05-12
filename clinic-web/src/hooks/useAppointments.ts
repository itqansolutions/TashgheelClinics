import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments';
import { useRole } from '@/store/authStore';

export const APPOINTMENTS_KEY = ['appointments'];

export function useAppointments(filters?: any, options: any = {}) {
  return useQuery<Appointment[]>({
    queryKey: [...APPOINTMENTS_KEY, filters],
    queryFn: async () => {
      const res = await appointmentsApi.getAll(filters);
      return res.data; // The array inside { success, data }
    },
    ...options
  });
}

export function useAppointment(id: number) {
  return useQuery<Appointment>({
    queryKey: [...APPOINTMENTS_KEY, id],
    queryFn: async () => {
      const res = await appointmentsApi.getById(id);
      return res.data; // The object inside { success, data }
    },
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

export function useDoctorAppointments(filters?: any, options: any = {}) {
  const role = useRole();
  return useQuery<Appointment[]>({
    queryKey: [...APPOINTMENTS_KEY, 'doctor-me', filters],
    queryFn: async () => {
      const res = await appointmentsApi.getDoctorMe(filters);
      return res.data; // The array inside { success, data }
    },
    enabled: role === 'Doctor',
    ...options
  });
}
