import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useRole, useSystemRole } from '@/store/authStore';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  allowedSystemRoles?: ('SYSTEM_ADMIN' | 'SUPPORT')[];
}

export function ProtectedRoute({ allowedRoles, allowedSystemRoles }: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const role = useRole();
  const systemRole = useSystemRole();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route strictly requires system admin/support
  if (allowedSystemRoles && (!systemRole || !allowedSystemRoles.includes(systemRole))) {
    return <Navigate to="/403" replace />;
  }

  // If route requires specific clinic tenant roles (and user is not a system admin bypass)
  if (allowedRoles && !systemRole && role && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
