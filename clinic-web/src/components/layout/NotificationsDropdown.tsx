import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, X, Calendar, User, Clock, 
  ArrowRight, Sparkles 
} from 'lucide-react';
import { usePatientList } from '@/hooks/usePatients';
import { useAppointments, useUpdateAppointment } from '@/hooks/useAppointments';
import { formatDateTime, getInitials } from '@/utils/format';
import { clsx } from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pendingAppointments: any[];
  isPendingLoading: boolean;
}

type TabId = 'online' | 'patients' | 'upcoming';

export function NotificationsDropdown({ isOpen, onClose, pendingAppointments, isPendingLoading }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('online');
  const updateMutation = useUpdateAppointment();

  // Fetch recent patients (sorted by createdAt desc)
  const { data: recentPatientsData, isLoading: patientsLoading } = usePatientList({ limit: 5 });
  const recentPatients = recentPatientsData?.data || [];

  // Fetch upcoming appointments
  const { data: upcomingAppointments = [], isLoading: upcomingLoading } = useAppointments(
    { limit: 5, status: 'Confirmed' },
    { enabled: isOpen }
  );

  if (!isOpen) return null;

  const handleStatusUpdate = async (id: number, status: 'Confirmed' | 'Cancelled', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status }
      });
    } catch (err) {
      alert(`Failed to update appointment status to ${status}`);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Invisible backdrop to close the dropdown when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-100 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200 flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-600 animate-swing" />
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Notifications</h3>
          </div>
          {pendingAppointments.length > 0 && (
            <span className="text-[9px] font-black uppercase text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">
              {pendingAppointments.length} pending reservation{pendingAppointments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Tab selection bar */}
        <div className="flex border-b border-gray-100 p-1 bg-gray-50/20">
          {(['online', 'patients', 'upcoming'] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
                activeTab === tab 
                  ? 'bg-white text-brand-600 shadow-sm border border-gray-100/50' 
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab === 'online' ? 'Online Portal' : tab === 'patients' ? 'New Patients' : 'Upcoming'}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 min-h-[250px]">
          
          {/* Tab: Online Reservations (Pending list) */}
          {activeTab === 'online' && (
            <div className="space-y-2">
              {isPendingLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pendingAppointments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-bold text-gray-600">All caught up!</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">No pending online reservations.</p>
                </div>
              ) : (
                pendingAppointments.map((appt) => (
                  <div 
                    key={appt.id}
                    onClick={() => handleNavigate('/appointments')}
                    className="p-3 border border-gray-100 rounded-2xl hover:bg-gray-50/50 cursor-pointer transition-colors relative group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-[10px] font-black shrink-0">
                        {getInitials(appt.patient?.fullName || 'Online')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{appt.patient?.fullName}</p>
                        <p className="text-[9px] font-semibold text-brand-600 truncate mt-0.5 uppercase">
                          {appt.service?.name || 'Primary Consultation'}
                        </p>
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-1">
                          <Clock className="w-3 h-3 text-gray-300" />
                          <span>{formatDateTime(appt.startTime)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Accept/Reject buttons */}
                    <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-dashed border-gray-100">
                      <button
                        onClick={(e) => handleStatusUpdate(appt.id, 'Cancelled', e)}
                        disabled={updateMutation.isPending}
                        className="flex-1 py-1.5 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 text-[10px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                      <button
                        onClick={(e) => handleStatusUpdate(appt.id, 'Confirmed', e)}
                        disabled={updateMutation.isPending}
                        className="flex-1 py-1.5 rounded-lg border border-green-100 bg-green-50/50 hover:bg-green-50 text-green-600 text-[10px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50 shadow-sm"
                      >
                        <Check className="w-3 h-3" />
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: New Patients */}
          {activeTab === 'patients' && (
            <div className="space-y-2">
              {patientsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recentPatients.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-500">No patients registered.</p>
                </div>
              ) : (
                recentPatients.map((patient: any) => (
                  <div 
                    key={patient.id}
                    onClick={() => handleNavigate(`/patients/${patient.id}`)}
                    className="flex items-center justify-between p-2.5 border border-transparent hover:border-gray-100 hover:bg-gray-50/30 rounded-2xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                        {patient.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{patient.fullName}</p>
                        <p className="text-[9px] text-gray-400 font-mono">{patient.code} · {patient.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Upcoming Appointments */}
          {activeTab === 'upcoming' && (
            <div className="space-y-2">
              {upcomingLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-500 font-bold">No upcoming appointments confirmed.</p>
                </div>
              ) : (
                upcomingAppointments.map((appt: any) => (
                  <div 
                    key={appt.id}
                    onClick={() => handleNavigate('/appointments')}
                    className="p-2.5 border border-transparent hover:border-gray-100 hover:bg-gray-50/30 rounded-2xl cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center text-[10px] font-black shrink-0">
                        CAL
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{appt.patient?.fullName}</p>
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">
                          Dr. {appt.doctor?.user?.fullName || appt.doctor?.fullName} · {appt.service?.name}
                        </p>
                        <p className="text-[9px] text-brand-600 font-semibold mt-1">
                          {formatDateTime(appt.startTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-50 p-3 bg-gray-50/30 text-center">
          <button 
            onClick={() => handleNavigate('/appointments')}
            className="text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest"
          >
            Manage Appointments Calendar
          </button>
        </div>
      </div>
    </>
  );
}
