import { Request } from 'express';
import prisma from '../config/db';

export interface SystemAdminAuditEntry {
  systemAdminUserId: number;
  tenantId:          number | null; // target tenant (null if platform-wide)
  action:            string;        // 'READ_PATIENTS', 'SUSPEND_TENANT', etc.
  method:            string;        // HTTP method: GET, POST, etc.
  endpoint:          string;        // Full request path
  targetRecordId?:   number | null; // ID of accessed record if applicable
  ipAddress:         string;
  userAgent:         string;
  timestamp?:        Date;
}

export async function auditSystemAdminAccess(
  req: Request,
  action: string,
  targetTenantId?: number,
  targetRecordId?: number
): Promise<void> {
  const systemAdminUserId = req.user?.sub;
  if (!systemAdminUserId) return;

  const entry = {
    systemAdminUserId,
    tenantId:       targetTenantId ?? null,
    action,
    method:         req.method,
    endpoint:       req.originalUrl || req.url,
    targetRecordId: targetRecordId ?? null,
    ipAddress:      req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
    userAgent:      (req.headers['user-agent'] ?? 'unknown').substring(0, 500),
    timestamp:      new Date(),
  };

  try {
    await prisma.systemAdminAuditLog.create({ data: entry });
  } catch (err) {
    console.error('[SYSTEM_ADMIN_AUDIT] Failed to persist audit log:', err);
  }

  console.info(`[SYSTEM_ADMIN_AUDIT] ${JSON.stringify(entry)}`);
}
