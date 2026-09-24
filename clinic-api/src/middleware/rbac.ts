import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export type Role = 'Admin' | 'System Admin' | 'Reception' | 'Receptionist' | 'Doctor' | 'Nurse' | 'Manager' | 'Accountant';

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

    const userRole = (req.user.role as string || '').trim().toLowerCase();
    const isSystemAdmin = userRole === 'system admin' || userRole === 'admin';

    // Check if user has explicit role OR if they are a System Admin (super user)
    // Equate 'reception' and 'receptionist' for seamless backward/forward compatibility
    const hasAccess = isSystemAdmin || allowedRoles.some(role => {
      const target = role.toLowerCase();
      if (target === userRole) return true;
      if ((target === 'reception' || target === 'receptionist') && (userRole === 'reception' || userRole === 'receptionist')) {
        return true;
      }
      return false;
    });

    if (!hasAccess) {
      const errorMsg = `Access denied for role "${req.user.role}". Required: ${allowedRoles.join(', ')}`;
      console.warn(`[RBAC] ${errorMsg} (User ID: ${req.user.sub})`);
      sendError(res, errorMsg, 403);
      return;
    }

    next();
  };
}

// Convenience exports for common role combos
export const adminOnly = rbac('Admin');
export const adminOrReception = rbac('Admin', 'Reception', 'Receptionist');
export const allRoles = rbac('Admin', 'Reception', 'Receptionist', 'Doctor', 'Nurse', 'Manager', 'Accountant');
