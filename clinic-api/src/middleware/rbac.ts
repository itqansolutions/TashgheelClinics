import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export type Role = 'Admin' | 'System Admin' | 'Reception' | 'Doctor' | 'Nurse' | 'Manager' | 'Accountant';

/**
 * Usage: router.delete('/:id', authenticate, rbac('Admin'), handler)
 * Usage: router.get('/', authenticate, rbac('Admin', 'Reception'), handler)
 */
export function rbac(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const userRole = (req.user.role as string || '').trim();
    const isSystemAdmin = userRole.toLowerCase() === 'system admin' || userRole.toLowerCase() === 'admin';

    // Check if user has explicit role OR if they are a System Admin (super user)
    const hasAccess = isSystemAdmin || allowedRoles.some(role => role.toLowerCase() === userRole.toLowerCase());

    if (!hasAccess) {
      const errorMsg = `Access denied for role "${userRole}". Required: ${allowedRoles.join(', ')}`;
      console.warn(`[RBAC] ${errorMsg} (User ID: ${req.user.sub})`);
      sendError(res, errorMsg, 403);
      return;
    }

    next();
  };
}

// Convenience exports for common role combos
export const adminOnly = rbac('Admin');
export const adminOrReception = rbac('Admin', 'Reception');
export const allRoles = rbac('Admin', 'Reception', 'Doctor', 'Nurse', 'Manager', 'Accountant');
