import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays, TrendingUp, Stethoscope, Clock, ArrowRight } from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { StatusBadge } from '@/components/ui/Badge';
import { KpiSkeleton, Skeleton } from '@/components/ui/Loader';
import { formatCurrency, formatTime, getInitials } from '@/utils/format';
import type { Appointment } from '@/types';
import { useRole } from '@/store/authStore';
import { useDoctorAppointments } from '@/hooks/useAppointments';

function useDashboardKpis() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => { const r = await dashboardApi.getKpis(); return r.data.data; },
    refetchInterval: 60_000,
  });
}

function useAppointmentsToday() {
  const role = useRole();
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.toISOString();
  }, []);

  const doctorQuery = useDoctorAppointments({ status: 'Confirmed', start: todayStart });
  const adminQuery = useQuery({
    queryKey: ['dashboard', 'appointments-today'],
    queryFn: async () => { const r = await dashboardApi.getAppointmentsToday(); return r.data.data; },
    refetchInterval: 60_000,
    enabled: role === 'Admin' || role === 'Reception',
  });

  return role === 'Doctor' ? doctorQuery : adminQuery;
}

export function DashboardPage() {
  const { data: kpis,  isLoading: kpisLoading  } = useDashboardKpis();
  const { data: appts, isLoading: apptsLoading } = useAppointmentsToday();
  const navigate = useNavigate();

  const kpiCards = [
    { title: 'Total Patients',       value: kpis?.totalPatients ?? 0,     subtitle: 'Active patients',                                               icon: Users,       iconBg: 'bg-brand-50',  iconColor: 'text-brand-600' },
    { title: "Today's Appointments", value: kpis?.todayAppointments ?? 0, subtitle: `${kpis?.pendingToday??0} pending · ${kpis?.confirmedToday??0} confirmed`, icon: CalendarDays, iconBg: 'bg-green-50',  iconColor: 'text-green-600' },
    { title: "Today's Revenue",      value: formatCurrency(kpis?.todayRevenue ?? 0), subtitle: 'Payments received today',                           icon: TrendingUp,  iconBg: 'bg-purple-50', iconColor: 'text-purple-600', isString: true },
    { title: 'Active Doctors',       value: kpis?.activeDoctors ?? 0,     subtitle: 'Currently on staff',                                           icon: Stethoscope, iconBg: 'bg-amber-50',  iconColor: 'text-amber-600' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpisLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpiCards.map((k) => (
              <div key={k.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{k.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1.5">
                    {k.isString ? k.value : (k.value as number).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{k.subtitle}</p>
                </div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${k.iconBg} shrink-0 ml-4`}>
                  <k.icon className={`w-5 h-5 ${k.iconColor}`} />
                </div>
              </div>
            ))}
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointments today */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Today's Appointments</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date().toLocaleDateString('en-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <button onClick={() => navigate('/appointments')}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {apptsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1"><Skeleton className="h-3 w-36" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : !(appts as Appointment[])?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <CalendarDays className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No appointments today</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(appts as Appointment[]).map((appt) => (
                <div key={appt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <button onClick={() => navigate(`/patients/${appt.patientId}`)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold shrink-0 hover:bg-brand-100 transition-colors">
                    {getInitials(appt.patient?.fullName ?? '?')}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate(`/patients/${appt.patientId}`)}
                      className="text-sm font-medium text-gray-900 hover:text-brand-600 truncate block text-left">
                      {appt.patient?.fullName}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(appt.startTime)}</span>
                      {appt.service && <span className="truncate">{appt.service.name}</span>}
                      {appt.doctor  && <span className="truncate">· Dr. {appt.doctor.user.fullName}</span>}
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Today's Breakdown</h3>
          </div>
          <div className="p-5 space-y-4">
            {kpisLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />) : (
              <>
                {[
                  { label: 'Pending',   value: kpis?.pendingToday ?? 0,   color: 'bg-yellow-400' },
                  { label: 'Confirmed', value: kpis?.confirmedToday ?? 0, color: 'bg-blue-400'   },
                  { label: 'Done',
                    value: Math.max(0,(kpis?.todayAppointments??0)-(kpis?.pendingToday??0)-(kpis?.confirmedToday??0)),
                    color: 'bg-green-400' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-xs text-gray-600">{s.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{s.value}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(kpis?.todayRevenue ?? 0)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
