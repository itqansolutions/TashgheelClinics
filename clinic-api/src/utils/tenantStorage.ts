import { AsyncLocalStorage } from 'async_hooks';

export interface RequestTenantStore {
  tenantId:   number;
  systemRole?: string | null;
}

export const tenantStorage = new AsyncLocalStorage<RequestTenantStore>();
