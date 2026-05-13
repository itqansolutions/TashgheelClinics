import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';

export const REPORT_KEYS = {
  summary: ['reports', 'summary'],
  financial: ['reports', 'financial'],
  appointments: ['reports', 'appointments'],
  revenue: ['reports', 'revenue'],
  cashflow: ['reports', 'cashflow'],
  breakdown: ['reports', 'breakdown'],
  commissions: ['reports', 'commissions'],
};

export function useFinancialSummary() {
  return useQuery({
    queryKey: REPORT_KEYS.financial,
    queryFn: async () => {
      const res = await reportsApi.getFinancialSummary();
      return res.data;
    }
  });
}

export function useReportSummary() {
  return useQuery({
    queryKey: REPORT_KEYS.summary,
    queryFn: async () => {
      const res = await reportsApi.getSummary();
      return res.data;
    }
  });
}
