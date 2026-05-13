import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute }     from './ProtectedRoute';
import { AppLayout }          from '@/components/layout/AppLayout';
import { LoginPage }          from '@/pages/Auth/LoginPage';
import { ForbiddenPage }      from '@/pages/Auth/ForbiddenPage';
const NotFoundPage = () => <div className="p-8 text-center text-gray-500">404 - Not Found</div>;
import { DashboardPage }      from '@/pages/Dashboard/DashboardPage';
import { PatientsListPage }   from '@/pages/Patients/PatientsListPage';
import { PatientFormPage }    from '@/pages/Patients/PatientFormPage';
import { PatientProfilePage } from '@/pages/Patients/PatientProfilePage';
import { DoctorsPage }        from '@/pages/Doctors/DoctorsPage';
import { SpecialtiesPage }    from '@/pages/Specialties/SpecialtiesPage';
import { SettingsPage }       from '@/pages/Settings/SettingsPage';
import { DoctorSchedulePage } from '@/pages/Doctors/DoctorSchedulePage';
// Sprint 4:
import { AppointmentsPage } from '@/pages/Appointments/AppointmentsPage';
import { CalendarPage }     from '@/pages/Appointments/CalendarPage';
import { PublicBookingPage } from '@/pages/PublicBooking/PublicBookingPage';
import { ConsultationPage }  from '@/pages/Appointments/ConsultationPage';
// Sprint 6:
import { ReportsPage }      from '@/pages/Reports/ReportsPage';
// Stock Module:
import { StockBalancePage } from '@/pages/Stock/StockBalancePage';
import { ProductsPage }     from '@/pages/Stock/ProductsPage';
import { VendorsPage }      from '@/pages/Stock/VendorsPage';

const router = createBrowserRouter([
  // ── Public ─────────────────────────────────────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/book',  element: <PublicBookingPage /> },
  { path: '/403',   element: <ForbiddenPage /> },
  { path: '/404',   element: <NotFoundPage /> },

  // ── All authenticated roles ─────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/',                 element: <Navigate to="/dashboard" replace /> },
        { path: '/dashboard',        element: <DashboardPage /> },
        { path: '/patients',         element: <PatientsListPage /> },
        { path: '/patients/new',     element: <PatientFormPage /> },
        { path: '/patients/:id',     element: <PatientProfilePage /> },
        { path: '/appointments',     element: <AppointmentsPage /> },
        { path: '/calendar',         element: <CalendarPage /> },
        { path: '/appointments/:id/consultation', element: <ConsultationPage /> },
      ],
    }],
  },

  // ── Admin & Reception only ─────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['Admin', 'Reception']} />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/doctors',          element: <DoctorsPage /> },
        { path: '/doctors/schedule', element: <DoctorSchedulePage /> },
        { path: '/specialties',      element: <SpecialtiesPage /> },
        { path: '/reports',          element: <ReportsPage /> },
        { path: '/stock/balance',    element: <StockBalancePage /> },
        { path: '/stock/products',   element: <ProductsPage /> },
        { path: '/stock/vendors',    element: <VendorsPage /> },
      ],
    }],
  },

  // ── Admin-only ──────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['Admin']} />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/settings', element: <SettingsPage /> },
      ],
    }],
  },

  { path: '*', element: <Navigate to="/404" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
