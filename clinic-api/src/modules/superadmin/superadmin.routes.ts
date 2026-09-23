import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { auditSystemAdminAccess } from '../../utils/systemAdminAudit';
import { invalidateTenantCache } from '../../middleware/resolveTenant';
import { rawPrisma } from '../../config/db';

const router = Router();

// Middleware: System Admin only
function requireSystemAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.systemRole !== 'SYSTEM_ADMIN' && req.user?.systemRole !== 'SUPPORT') {
    return sendError(res, 'Access denied. System Admin required.', 403);
  }
  next();
}

router.use(authenticate, requireSystemAdmin);

/**
 * @route GET /api/superadmin/tenants
 * @desc  List all clinics/tenants with subscription summary
 */
router.get('/tenants', async (req, res, next) => {
  try {
    await auditSystemAdminAccess(req, 'BUSINESS_ACTION:LIST_TENANTS');
    const tenants = await rawPrisma.tenant.findMany({
      include: {
        subscriptions: {
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            users: true,
            patients: true,
            doctors: true,
            appointments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, tenants);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/superadmin/tenants/:id
 * @desc  Get detailed tenant info
 */
router.get('/tenants/:id', async (req, res, next) => {
  try {
    const tenantId = Number(req.params.id);
    await auditSystemAdminAccess(req, 'BUSINESS_ACTION:GET_TENANT', tenantId);

    const tenant = await rawPrisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: { orderBy: { startDate: 'desc' } },
        _count: {
          select: {
            users: true,
            patients: true,
            doctors: true,
            appointments: true,
          },
        },
      },
    });

    if (!tenant) return sendError(res, 'Tenant not found', 404);
    sendSuccess(res, tenant);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/superadmin/tenants/:id/status
 * @desc  Change tenant status (ACTIVE, SUSPENDED, CANCELLED)
 */
router.patch('/tenants/:id/status', async (req, res, next) => {
  try {
    const tenantId = Number(req.params.id);
    const { status } = req.body as { status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' };

    await auditSystemAdminAccess(req, `BUSINESS_ACTION:SET_STATUS_${status}`, tenantId);

    const updated = await rawPrisma.tenant.update({
      where: { id: tenantId },
      data:  { status },
    });

    invalidateTenantCache(tenantId);
    sendSuccess(res, updated, `Tenant status updated to ${status}`);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/superadmin/audit-logs
 * @desc  List cross-tenant System Admin audit logs
 */
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { limit = '50', offset = '0' } = req.query as Record<string, string>;
    const logs = await rawPrisma.systemAdminAuditLog.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: { timestamp: 'desc' },
      include: {
        systemAdmin: { select: { id: true, fullName: true, email: true } },
      },
    });
    sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
});

export default router;
