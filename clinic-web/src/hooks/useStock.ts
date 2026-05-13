import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '@/api/stock';

export const STOCK_KEYS = {
  products: ['stock', 'products'],
  vendors:  ['stock', 'vendors'],
  balances: ['stock', 'balances'],
  ledger:   (id: number) => ['stock', 'ledger', id],
};

export function useProducts(filters: any = {}) {
  return useQuery({
    queryKey: [...STOCK_KEYS.products, filters],
    queryFn: async () => {
      const res = await stockApi.getProducts(filters);
      return res.data;
    }
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.products });
    }
  });
}

export function useVendors() {
  return useQuery({
    queryKey: STOCK_KEYS.vendors,
    queryFn: async () => {
      const res = await stockApi.getVendors();
      return res.data;
    }
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockApi.createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.vendors });
    }
  });
}

export function useStockBalances() {
  return useQuery({
    queryKey: STOCK_KEYS.balances,
    queryFn: async () => {
      const res = await stockApi.getBalances();
      return res.data;
    }
  });
}

export function useRecordPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockApi.recordPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.balances });
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.products });
    }
  });
}
