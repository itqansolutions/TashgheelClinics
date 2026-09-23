import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { rawPrisma } from '../config/db';
import { TenantPlan } from '@prisma/client';

export type PlanFeature = 'hasReports' | 'hasStock' | 'hasFinance' | 'hasApi';

/**
 * Middleware factory that enforces feature availability based on tenant plan.
 */
export function requireFeature(feature: PlanFeature) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // System admin bypasses plan limits
    if (req.user?.systemRole === 'SYSTEM_ADMIN' || req.user?.systemRole === 'SUPPORT') {
      return next();
    }

    const plan = (req.tenantCtx?.plan || 'TRIAL') as TenantPlan;

    // Load limits for plan (PlanLimit table seeded in Migration 001)
    const limit = await rawPrisma.planLimit.findUnique({
      where: { plan },
    });

    if (!limit || !limit[feature]) {
      return sendError(
        res,
        `Feature "${feature}" is not available on your current plan (${plan}). Please upgrade to unlock this feature.`,
        403
      );
    }

    next();
  };
}

/**
 * Middleware factory that checks resource count quotas before allowing creations.
 */
export function enforceQuota(resource: 'patients' | 'doctors' | 'users') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.systemRole === 'SYSTEM_ADMIN') return next();

    const tenantId = req.tenantCtx?.tenantId;
    if (!tenantId) return next();

    const plan = (req.tenantCtx?.plan || 'TRIAL') as TenantPlan;
    const limit = await rawPrisma.planLimit.findUnique({ where: { plan } });
    if (!limit) return next();

    if (resource === 'patients') {
      const current = await rawPrisma.patient.count({ where: { tenantId } });
      if (current >= limit.maxPatients) {
        return sendError(
          res,
          `Patient quota limit of ${limit.maxPatients} reached for ${plan} plan. Please upgrade to register more patients.`,
          403
        );
      }
    } else if (resource === 'doctors') {
      const current = await rawPrisma.doctor.count({ where: { tenantId } });
      if (current >= limit.maxDoctors) {
        return sendError(
          res,
          `Doctor quota limit of ${limit.maxDoctors} reached for ${plan} plan. Please upgrade to add more doctors.`,
          403
        );
      }
    } else if (resource === 'users') {
      const current = await rawPrisma.user.count({ where: { tenantId } });
      if (current >= limit.maxUsers) {
        return sendError(
          res,
          `User quota limit of ${limit.maxUsers} reached for ${plan} plan. Please upgrade to invite more team members.`,
          403
        );
      }
    }

    next();
  };
}
