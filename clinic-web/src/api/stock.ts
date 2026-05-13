import api from './client';

export const stockApi = {
  // Products
  getProducts: (filters: any = {}) => api.get('/stock/products', { params: filters }),
  createProduct: (data: any) => api.post('/stock/products', data),

  // Vendors
  getVendors: () => api.get('/stock/vendors'),
  createVendor: (data: any) => api.post('/stock/vendors', data),

  // Balance & Purchases
  getBalances: () => api.get('/stock/balance'),
  recordPurchase: (data: any) => api.post('/stock/purchase', data),
  
  // Vendor Statements & Payments
  getVendorStatement: (vendorId: number) => api.get(`/stock/vendors/${vendorId}/statement`),
  recordVendorPayment: (data: any) => api.post('/stock/vendors/payment', data),

  // Ledger
  getProductLedger: (productId: number) => api.get(`/stock/ledger/${productId}`), 
};
