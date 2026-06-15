import { useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useUser } from '@/store/authStore';
import { format } from 'date-fns';
import { QuickSearchModal } from './QuickSearchModal';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useAppointments } from '@/hooks/useAppointments';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const user = useUser();
  const today = format(new Date(), 'EEEE, MMMM d yyyy');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Fetch pending appointments (online reservations)
  const { data: pendingAppointments = [], isLoading: isPendingLoading } = useAppointments({ status: 'Pending' });
  const hasNotifications = pendingAppointments.length > 0;

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Menu Toggle + Page title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 lg:hidden text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-sm lg:text-base font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-none">{title}</h1>
          <p className="hidden sm:block text-[10px] lg:text-[11px] text-gray-400">{today}</p>
        </div>
      </div>

      {/* Right: Search + Notifications + User */}
      <div className="flex items-center gap-2 lg:gap-3">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick search...</span>
          <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-white border border-gray-200 rounded">
            ⌘K
          </kbd>
        </button>

        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {hasNotifications && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <NotificationsDropdown 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
            pendingAppointments={pendingAppointments}
            isPendingLoading={isPendingLoading}
          />
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600">
            <span className="text-[11px] font-semibold text-white">
              {user?.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <QuickSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </header>
  );
}

