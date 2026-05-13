import { apiFetch } from './apiFetch';

export const stockApi = {
  // Products
  getProducts: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiFetch(`/stock/products?${query}`);
  },
  createProduct: (data: any) => apiFetch('/stock/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Vendors
  getVendors: () => apiFetch('/stock/vendors'),
  createVendor: (data: any) => apiFetch('/stock/vendors', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Balance & Purchases
  getBalances: () => apiFetch('/stock/balance'),
  recordPurchase: (data: any) => apiFetch('/stock/purchase', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
