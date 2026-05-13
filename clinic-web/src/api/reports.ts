import api from './client';

export const reportsApi = {
  getSummary: () => 
    api.get('/reports/summary').then(res => res.data),
  getFinancialSummary: () =>
    api.get('/reports/financial-summary').then(res => res.data),
  getIncomeBreakdown: () =>
    api.get('/reports/income-breakdown').then(res => res.data),
  getDoctorCommissions: () =>
    api.get('/reports/doctor-commissions').then(res => res.data),
  getCashFlow: () =>
    api.get('/reports/cash-flow').then(res => res.data),
  getAppointmentsStatus: () => 
    api.get('/reports/appointments-status').then(res => res.data),
  getRevenueByDoctor: () => 
    api.get('/reports/revenue-doctor').then(res => res.data),
};
