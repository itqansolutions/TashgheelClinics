import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const PAGE_TITLES: Record<string, string> = {
  '/app/dashboard':        'Dashboard',
  '/app/patients':         'Patients',
  '/app/patients/new':     'New Patient',
  '/app/appointments':     'Appointments',
  '/app/calendar':         'Calendar',
  '/app/doctors':          'Doctors',
  '/app/doctors/schedule': 'Doctor Schedule',
  '/app/specialties':      'Specialties & Services',
  '/app/reports':          'Reports',
  '/app/finance':          'Finance & Accounting',
  '/app/stock/balance':    'Stock Balance',
  '/app/stock/products':   'Products',
  '/app/stock/vendors':    'Vendors',
  '/app/settings':         'Clinic Settings',
  // Legacy backward-compatibility fallbacks
  '/dashboard':            'Dashboard',
  '/patients':             'Patients',
  '/appointments':         'Appointments',
  '/calendar':             'Calendar',
  '/doctors':              'Doctors',
  '/specialties':          'Specialties & Services',
  '/reports':              'Reports',
  '/settings':             'Clinic Settings',
};

export function AppLayout() {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Match title for dynamic paths like /patients/123
  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ??
    'Clinic';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Topbar title={title} onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Main content — offset by sidebar width on desktop + topbar height */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
