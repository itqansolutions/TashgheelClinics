import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useT } from '@/i18n';

const PAGE_TITLES: Record<string, string> = {
  '/app/dashboard':        'title.dashboard',
  '/app/patients':         'title.patients',
  '/app/patients/new':     'title.newPatient',
  '/app/appointments':     'title.appointments',
  '/app/calendar':         'title.calendar',
  '/app/doctors':          'title.doctors',
  '/app/doctors/schedule': 'title.schedule',
  '/app/specialties':      'title.specialties',
  '/app/reports':          'title.reports',
  '/app/finance':          'title.finance',
  '/app/stock/balance':    'title.stockBalance',
  '/app/stock/products':   'title.products',
  '/app/stock/vendors':    'title.vendors',
  '/app/settings':         'title.settings',
  // Legacy backward-compatibility fallbacks
  '/dashboard':            'title.dashboard',
  '/patients':             'title.patients',
  '/appointments':         'title.appointments',
  '/calendar':             'title.calendar',
  '/doctors':              'title.doctors',
  '/specialties':          'title.specialties',
  '/reports':              'title.reports',
  '/settings':             'title.settings',
};

export function AppLayout() {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Match title for dynamic paths like /patients/123
  const t = useT();
  const titleKey =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ??
    'title.dashboard';
  const title = t(titleKey);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Topbar title={title} onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Main content — offset by sidebar width on desktop + topbar height */}
      <main className="lg:ml-64 rtl:lg:ml-0 rtl:lg:mr-64 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
