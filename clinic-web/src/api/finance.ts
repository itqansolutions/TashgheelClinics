import api from './client';
import type { ApiResponse, Appointment, FinancialTransaction } from '@/types';

export const financeApi = {
  getQueue: () =>
    api.get<ApiResponse<Appointment[]>>('/finance/queue'),
    
  getTransactions: (params?: any) =>
    api.get<ApiResponse<FinancialTransaction[]>>('/finance/transactions', { params }),
    
  createTransaction: (data: any) =>
    api.post<ApiResponse<FinancialTransaction>>('/finance/transactions', data),
    
  collectPayment: (data: { appointmentId: number; amount: number; method: string; notes?: string }) =>
    api.post<ApiResponse<any>>('/finance/collect', data),
    
  getSettings: () =>
    api.get<ApiResponse<Record<string, string>>>('/finance/settings'),
    
  updateSettings: (settings: Record<string, string>) =>
    api.put<ApiResponse<null>>('/finance/settings', { settings }),
};
