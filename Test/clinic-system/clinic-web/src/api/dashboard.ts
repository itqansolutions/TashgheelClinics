import api from './client';
import type { ApiResponse, Appointment } from '@/types';

export interface DashboardKpis {
  totalPatients:     number;
  todayAppointments: number;
  todayRevenue:      number;
  activeDoctors:     number;
  pendingToday:      number;
  confirmedToday:    number;
}

export const dashboardApi = {
  getKpis: () =>
    api.get<ApiResponse<DashboardKpis>>('/dashboard/kpis'),

  getAppointmentsToday: () =>
    api.get<ApiResponse<Appointment[]>>('/dashboard/appointments-today'),
};
