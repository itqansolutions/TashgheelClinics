import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export type Role = 'Admin' | 'Reception' | 'Doctor';

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

    if (!allowedRoles.includes(req.user.role as Role)) {
      sendError(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`, 403);
      return;
    }

    next();
  };
}

// Convenience exports for common role combos
export const adminOnly = rbac('Admin');
export const adminOrReception = rbac('Admin', 'Reception');
export const allRoles = rbac('Admin', 'Reception', 'Doctor');
