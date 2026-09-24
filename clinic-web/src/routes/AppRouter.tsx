import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute }     from './ProtectedRoute';
import { AppLayout }          from '@/components/layout/AppLayout';
import { LoginPage }          from '@/pages/Auth/LoginPage';
import { RegisterPage }       from '@/pages/Auth/RegisterPage';
import { VerifyEmailPage }    from '@/pages/Auth/VerifyEmailPage';
import { SuperAdminPage }     from '@/pages/SuperAdmin/SuperAdminPage';
import { ForbiddenPage }      from '@/pages/Auth/ForbiddenPage';
import { DashboardPage }      from '@/pages/Dashboard/DashboardPage';
import { PatientsListPage }   from '@/pages/Patients/PatientsListPage';
import { PatientFormPage }    from '@/pages/Patients/PatientFormPage';
import { PatientProfilePage } from '@/pages/Patients/PatientProfilePage';
import { DoctorsPage }        from '@/pages/Doctors/DoctorsPage';
import { SpecialtiesPage }    from '@/pages/Specialties/SpecialtiesPage';
import { SettingsPage }       from '@/pages/Settings/SettingsPage';
import { DoctorSchedulePage } from '@/pages/Doctors/DoctorSchedulePage';
import { AppointmentsPage }   from '@/pages/Appointments/AppointmentsPage';
import { CalendarPage }       from '@/pages/Appointments/CalendarPage';
import { PublicBookingPage }  from '@/pages/PublicBooking/PublicBookingPage';
import { ConsultationPage }   from '@/pages/Appointments/ConsultationPage';
import { ReportsPage }        from '@/pages/Reports/ReportsPage';
import { StockBalancePage }   from '@/pages/Stock/StockBalancePage';
import { ProductsPage }       from '@/pages/Stock/ProductsPage';
import { VendorsPage }        from '@/pages/Stock/VendorsPage';
import { FinancePage }        from '@/pages/Finance/FinancePage';
import { useIsAuthenticated, useSystemRole } from '@/store/authStore';

const NotFoundPage = () => <div className="p-8 text-center text-gray-500">404 - Not Found</div>;

// Root redirect handler: determines context based on authenticated user
function RootRedirect() {
  const isAuthenticated = useIsAuthenticated();
  const systemRole = useSystemRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (systemRole === 'SYSTEM_ADMIN' || systemRole === 'SUPPORT') {
    return <Navigate to="/superadmin" replace />;
  }

  return <Navigate to="/app/dashboard" replace />;
}

const router = createBrowserRouter([
  // ── Public & Auth ───────────────────────────────────────────────────────
  { path: '/',             element: <RootRedirect /> },
  { path: '/login',        element: <LoginPage /> },
  { path: '/register',     element: <RegisterPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/c/:slug',      element: <PublicBookingPage /> },
  { path: '/c/:slug/book', element: <PublicBookingPage /> },
  { path: '/403',          element: <ForbiddenPage /> },
  { path: '/404',          element: <NotFoundPage /> },

  // ── Clinic Workspace (/app/*) ──────────────────────────────────────────
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '',                   element: <Navigate to="/app/dashboard" replace /> },
        { path: 'dashboard',          element: <DashboardPage /> },
        { path: 'patients',           element: <PatientsListPage /> },
        { path: 'patients/new',       element: <PatientFormPage /> },
        { path: 'patients/:id',       element: <PatientProfilePage /> },
        { path: 'appointments',       element: <AppointmentsPage /> },
        { path: 'calendar',           element: <CalendarPage /> },
        { path: 'appointments/:id/consultation', element: <ConsultationPage /> },
      ],
    }],
  },

  // ── Clinic Admin, Reception, Manager & Accountant (/app/*) ─────────────
  {
    path: '/app',
    element: <ProtectedRoute allowedRoles={['Admin', 'Reception', 'Receptionist', 'Manager', 'Accountant']} />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: 'doctors',          element: <DoctorsPage /> },
        { path: 'doctors/schedule', element: <DoctorSchedulePage /> },
        { path: 'specialties',      element: <SpecialtiesPage /> },
        { path: 'reports',          element: <ReportsPage /> },
        { path: 'finance',          element: <FinancePage /> },
        { path: 'stock/balance',    element: <StockBalancePage /> },
        { path: 'stock/products',   element: <ProductsPage /> },
        { path: 'stock/vendors',    element: <VendorsPage /> },
      ],
    }],
  },

  // ── Clinic Admin & Manager-only (/app/settings) ────────────────────────
  {
    path: '/app',
    element: <ProtectedRoute allowedRoles={['Admin', 'Manager']} />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: 'settings', element: <SettingsPage /> },
      ],
    }],
  },

  // ── Platform Super Admin Workspace (/superadmin) ──────────────────────
  {
    element: <ProtectedRoute allowedSystemRoles={['SYSTEM_ADMIN', 'SUPPORT']} />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/superadmin', element: <SuperAdminPage /> },
      ],
    }],
  },

  // ── Backward-Compatibility Redirects (from legacy paths to /app/*) ──────
  { path: '/dashboard',         element: <Navigate to="/app/dashboard" replace /> },
  { path: '/patients',          element: <Navigate to="/app/patients" replace /> },
  { path: '/patients/*',        element: <Navigate to="/app/patients" replace /> },
  { path: '/appointments',      element: <Navigate to="/app/appointments" replace /> },
  { path: '/appointments/*',    element: <Navigate to="/app/appointments" replace /> },
  { path: '/calendar',          element: <Navigate to="/app/calendar" replace /> },
  { path: '/doctors',           element: <Navigate to="/app/doctors" replace /> },
  { path: '/doctors/*',         element: <Navigate to="/app/doctors" replace /> },
  { path: '/specialties',       element: <Navigate to="/app/specialties" replace /> },
  { path: '/reports',           element: <Navigate to="/app/reports" replace /> },
  { path: '/finance',           element: <Navigate to="/app/finance" replace /> },
  { path: '/stock/*',           element: <Navigate to="/app/stock/balance" replace /> },
  { path: '/settings',          element: <Navigate to="/app/settings" replace /> },

  { path: '*', element: <Navigate to="/404" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
