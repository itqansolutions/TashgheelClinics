import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';

export const FINANCE_KEYS = {
  queue: ['finance', 'queue'],
  transactions: (params: any) => ['finance', 'transactions', params],
  settings: ['finance', 'settings'],
};

export function useFinanceQueue() {
  return useQuery({
    queryKey: FINANCE_KEYS.queue,
    queryFn: async () => {
      const res = await financeApi.getQueue();
      return res.data;
    }
  });
}

export function useFinanceTransactions(params: any = {}) {
  return useQuery({
    queryKey: FINANCE_KEYS.transactions(params),
    queryFn: async () => {
      const res = await financeApi.getTransactions(params);
      return res.data;
    }
  });
}

export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    }
  });
}

export function useCollectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeApi.collectPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEYS.queue });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    }
  });
}

export function useInvoiceSettings() {
  return useQuery({
    queryKey: FINANCE_KEYS.settings,
    queryFn: async () => {
      const res = await financeApi.getSettings();
      return res.data.data as Record<string, string>;
    }
  });
}

export function useUpdateInvoiceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_KEYS.settings });
    }
  });
}
