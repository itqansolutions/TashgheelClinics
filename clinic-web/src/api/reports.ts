import api from './client';

export const reportsApi = {
  getSummary: () => 
    api.get('/reports/summary').then(res => res.data),
  getAppointmentStatus: () => 
    api.get('/reports/appointments-status').then(res => res.data),
  getRevenueByDoctor: () => 
    api.get('/reports/revenue-doctor').then(res => res.data),
};
