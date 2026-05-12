import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, Stethoscope, CalendarDays,
  BarChart3, Settings, Heart, Scissors, LogOut,
} from 'lucide-react';
import { useUser, useRole, useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

interface NavItem {
  label: string;
  path:  string;
  icon:  React.ElementType;
  roles?: Array<'Admin' | 'Reception' | 'Doctor'>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    path: '/dashboard',   icon: LayoutDashboard },
  { label: 'Patients',     path: '/patients',    icon: Users           },
  { label: 'Appointments', path: '/appointments',icon: CalendarDays    },
  { label: 'Doctors',      path: '/doctors',     icon: Stethoscope,    roles: ['Admin', 'Reception'] },
  { label: 'Specialties',  path: '/specialties', icon: Scissors,       roles: ['Admin']              },
  { label: 'Reports',      path: '/reports',     icon: BarChart3,      roles: ['Admin']              },
  { label: 'Settings',     path: '/settings',    icon: Settings,       roles: ['Admin']              },
];

export function Sidebar() {
  const user    = useUser();
  const role    = useRole();
  const logout  = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const visible = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));

  const handleLogout = async () => {
    try { await authApi.logout(); } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <aside className="flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">Tashgheel</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Clinics</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {visible.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-inactive')
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 p-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 shrink-0">
            <span className="text-xs font-semibold text-brand-700">
              {user?.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-[10px] text-gray-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link sidebar-link-inactive w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
