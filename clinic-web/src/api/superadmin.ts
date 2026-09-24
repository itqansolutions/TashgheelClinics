import api from './client';
import {
  ApiResponse,
  TenantListItem,
  SystemAdminAuditLogItem,
} from '@/types';

export const superadminApi = {
  getTenants: () =>
    api.get<ApiResponse<TenantListItem[]>>('/superadmin/tenants'),

  getTenant: (id: number) =>
    api.get<ApiResponse<TenantListItem>>(`/superadmin/tenants/${id}`),

  updateTenantStatus: (id: number, status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED') =>
    api.patch<ApiResponse<TenantListItem>>(`/superadmin/tenants/${id}/status`, { status }),

  getAuditLogs: (limit = 50, offset = 0) =>
    api.get<ApiResponse<SystemAdminAuditLogItem[]>>(`/superadmin/audit-logs?limit=${limit}&offset=${offset}`),
};
