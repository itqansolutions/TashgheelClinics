import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute }     from './ProtectedRoute';
import { AppLayout }          from '@/components/layout/AppLayout';
import { LoginPage }          from '@/pages/Auth/LoginPage';
import { ForbiddenPage }      from '@/pages/Auth/ForbiddenPage';
import { NotFoundPage }       from '@/pages/Auth/NotFoundPage';
import { DashboardPage }      from '@/pages/Dashboard/DashboardPage';
import { PatientsListPage }   from '@/pages/Patients/PatientsListPage';
import { PatientFormPage }    from '@/pages/Patients/PatientFormPage';
import { PatientProfilePage } from '@/pages/Patients/PatientProfilePage';
import { DoctorsPage }        from '@/pages/Doctors/DoctorsPage';
import { SpecialtiesPage }    from '@/pages/Specialties/SpecialtiesPage';
import { SettingsPage }       from '@/pages/Settings/SettingsPage';
// Sprint 4:
// import { AppointmentsPage } from '@/pages/Appointments/AppointmentsPage';
// import { CalendarPage }     from '@/pages/Appointments/CalendarPage';
// Sprint 6:
// import { ReportsPage }      from '@/pages/Reports/ReportsPage';

const router = createBrowserRouter([
  // ── Public ─────────────────────────────────────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/book',  element: <div className="p-8 text-center text-gray-500">Public Booking — Sprint 5</div> },
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
        { path: '/doctors',          element: <DoctorsPage /> },
        { path: '/specialties',      element: <SpecialtiesPage /> },
        // { path: '/appointments',  element: <AppointmentsPage /> },
        // { path: '/calendar',      element: <CalendarPage /> },
        // { path: '/reports',       element: <ReportsPage /> },
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
        // { path: '/users', element: <UsersPage /> },
      ],
    }],
  },

  { path: '*', element: <Navigate to="/404" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
