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
    queryFn: () => stockApi.getProducts(filters)
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
    queryFn: () => stockApi.getVendors()
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
    queryFn: () => stockApi.getBalances()
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
