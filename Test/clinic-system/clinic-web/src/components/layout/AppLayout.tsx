import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/patients':     'Patients',
  '/appointments': 'Appointments',
  '/calendar':     'Calendar',
  '/doctors':      'Doctors',
  '/specialties':  'Specialties & Services',
  '/reports':      'Reports',
  '/settings':     'Settings',
};

export function AppLayout() {
  const { pathname } = useLocation();

  // Match title for dynamic paths like /patients/123
  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ??
    'Clinic';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Topbar title={title} />

      {/* Main content — offset by sidebar width + topbar height */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
